// app/(tabs)/desk.tsx
// Desk — the back office. Record of work, earnings, and history.
// Per NAV_SPEC.md §3 + XPROHUB_DOCTRINE §6 + FINANCIAL_DATA_PRINCIPLE.
// READ-ONLY — all SELECT queries, no writes.

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { Oswald_600SemiBold } from '@expo-google-fonts/oswald';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { fmtPrice, fmtReceiptDate } from '../../lib/format';

// ── Types ──────────────────────────────────────────────────────

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  customer_id: string;
  worker_id: string | null;
  agreed_price: number | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  timing: string | null;
  bid_count?: number;
  _role: 'taken' | 'posted' | 'applied';
  _bidPrice?: number | null;
}

interface CompletedJob {
  id: string;
  title: string;
  completed_at: string;
  customer_id: string;
  worker_id: string | null;
  agreed_price: number | null;
  worker_payout: number | null;
  amount: number | null;
}

// ── Helpers ────────────────────────────────────────────────────

function editionLine(activeCount: number): string {
  const d = new Date();
  const weekday = d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const base = `${weekday} ${day} ${month} ${year}`;
  if (activeCount > 0) {
    return `${base} \u00b7 ${activeCount} ACTIVE \u00b7 LEDGER OPEN`;
  }
  return `${base} \u00b7 LEDGER OPEN`;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins} MIN AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HR AGO`;
  const days = Math.floor(hrs / 24);
  return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
}

function getMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

// ── Main Screen ────────────────────────────────────────────────

export default function DeskScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold_Italic,
    SpaceGrotesk_500Medium,
    Oswald_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Section 1: Active jobs
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);

  // Section 2: Earnings
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [earningsCount, setEarningsCount] = useState(0);

  // Section 3: Job history
  const [history, setHistory] = useState<CompletedJob[]>([]);

  // ── Fetch ────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    // ── Section 1: Active jobs (both roles) ──
    const { data: takenRows } = await supabase
      .from('jobs')
      .select('id, title, status, customer_id, worker_id, agreed_price, budget_min, budget_max, created_at, timing')
      .eq('worker_id', user.id)
      .in('status', ['matched', 'in_progress', 'pending_confirmation'])
      .order('created_at', { ascending: false });

    const { data: postedRows } = await supabase
      .from('jobs')
      .select('id, title, status, customer_id, worker_id, agreed_price, budget_min, budget_max, created_at, timing')
      .eq('customer_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const taken: ActiveJob[] = (takenRows ?? []).map(j => ({ ...j, _role: 'taken' as const }));
    const posted: ActiveJob[] = (postedRows ?? []).map(j => ({ ...j, _role: 'posted' as const }));

    // Bid counts for posted jobs
    if (posted.length > 0) {
      const ids = posted.map(j => j.id);
      const { data: bidRows } = await supabase
        .from('bids')
        .select('job_id')
        .in('job_id', ids)
        .eq('status', 'pending');
      if (bidRows) {
        const counts: Record<string, number> = {};
        for (const b of bidRows) { counts[b.job_id] = (counts[b.job_id] ?? 0) + 1; }
        for (const j of posted) { j.bid_count = counts[j.id] ?? 0; }
      }
    }

    // APPLIED — worker's pending bids (awaiting decision)
    const { data: appliedRows } = await supabase
      .from('bids')
      .select(`
        id, proposed_price, created_at,
        job:jobs!job_id(id, title, status, customer_id, worker_id, agreed_price, budget_min, budget_max, timing)
      `)
      .eq('worker_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const applied: ActiveJob[] = (appliedRows ?? [])
      .filter((b: any) => b.job)
      .map((b: any) => ({
        id: b.job.id,
        title: b.job.title,
        status: b.job.status,
        customer_id: b.job.customer_id,
        worker_id: b.job.worker_id,
        agreed_price: b.job.agreed_price ? Number(b.job.agreed_price) : null,
        budget_min: b.job.budget_min ? Number(b.job.budget_min) : null,
        budget_max: b.job.budget_max ? Number(b.job.budget_max) : null,
        created_at: b.created_at,
        timing: b.job.timing,
        _role: 'applied' as const,
        _bidPrice: b.proposed_price ? Number(b.proposed_price) : null,
      }));

    const merged = [...taken, ...posted, ...applied];
    setActiveJobs(merged);

    // ── Section 2: Earnings this week ──
    const monday = getMonday();
    const { data: paymentRows } = await supabase
      .from('payments')
      .select('worker_payout')
      .eq('worker_id', user.id)
      .eq('escrow_status', 'released')
      .gte('released_at', monday.toISOString());

    let total = 0;
    let count = 0;
    if (paymentRows) {
      for (const p of paymentRows) {
        total += Number(p.worker_payout ?? 0);
        count++;
      }
    }
    setEarningsTotal(total);
    setEarningsCount(count);

    // ── Section 3: Job history (completed, both roles) ──
    const { data: historyRows } = await supabase
      .from('jobs')
      .select(`
        id, title, completed_at, customer_id, worker_id, agreed_price,
        payment:payments!job_id(worker_payout, amount)
      `)
      .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20);

    const completedJobs: CompletedJob[] = (historyRows ?? []).map((row: any) => {
      const payment = Array.isArray(row.payment) ? row.payment[0] : row.payment;
      return {
        id: row.id,
        title: row.title,
        completed_at: row.completed_at,
        customer_id: row.customer_id,
        worker_id: row.worker_id,
        agreed_price: row.agreed_price ? Number(row.agreed_price) : null,
        worker_payout: payment?.worker_payout ? Number(payment.worker_payout) : null,
        amount: payment?.amount ? Number(payment.amount) : null,
      };
    });
    setHistory(completedJobs);

    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── Render ───────────────────────────────────────────────────

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {/* ── Masthead ── */}
        <Text style={s.eyebrow}>DESK {'\u00b7'} YOUR WORKSPACE</Text>
        <Text style={s.title}>Your desk.</Text>
        <Text style={s.edition}>{editionLine(activeJobs.length)}</Text>

        {/* ── Section 1: Active · Both Roles ── */}
        <Text style={s.sectionEyebrow}>ACTIVE {'\u00b7'} BOTH ROLES</Text>

        {activeJobs.length === 0 ? (
          <Text style={s.emptyLine}>Nothing active right now.</Text>
        ) : (
          activeJobs.map(job => {
            const role = job._role;
            const price = role === 'applied'
              ? (job._bidPrice ?? job.agreed_price ?? job.budget_max ?? job.budget_min)
              : (job.agreed_price ?? job.budget_max ?? job.budget_min);

            const tagStyle = role === 'taken' ? s.roleTagGreen
              : role === 'posted' ? s.roleTagAmber
              : s.roleTagBlue;

            const tagText = role === 'taken'
              ? `\u25CF TAKEN \u00b7 ${job.status === 'matched' ? 'MATCHED' : job.status === 'pending_confirmation' ? 'PENDING CONFIRM' : 'IN PROGRESS'}`
              : role === 'posted'
              ? `\u25C6 POSTED \u00b7 AWAITING BIDS`
              : `\u25CF APPLIED \u00b7 AWAITING DECISION`;

            const metaText = role === 'taken'
              ? (job.timing ? job.timing.toUpperCase() : timeAgo(job.created_at))
              : role === 'posted'
              ? `${job.bid_count ?? 0} BID${(job.bid_count ?? 0) !== 1 ? 'S' : ''} \u00b7 POSTED ${timeAgo(job.created_at)}`
              : `APPLIED ${timeAgo(job.created_at)}`;

            const handlePress = async () => {
              if (role === 'posted') {
                router.push(`/(tabs)/job-bids?job_id=${job.id}` as any);
              } else if (role === 'taken') {
                const { data: chatRow } = await supabase
                  .from('chats')
                  .select('id')
                  .eq('job_id', job.id)
                  .maybeSingle();
                if (chatRow?.id) {
                  router.push(`/(tabs)/job-chat?chat_id=${chatRow.id}` as any);
                }
              } else {
                router.push(`/(tabs)/job-detail?job_id=${job.id}` as any);
              }
            };

            return (
              <TouchableOpacity
                key={`${role}-${job.id}`}
                style={s.activeCard}
                onPress={handlePress}
                activeOpacity={0.7}
              >
                <Text style={[s.roleTag, tagStyle]}>{tagText}</Text>
                <Text style={s.activeTitle} numberOfLines={1}>{job.title}</Text>
                <View style={s.activeFoot}>
                  <Text style={s.activeMeta}>{metaText}</Text>
                  {price != null && (
                    <Text style={s.activePrice}>{fmtPrice(price)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Section 2: Earnings · This Week ── */}
        <Text style={s.sectionEyebrow}>EARNINGS {'\u00b7'} THIS WEEK</Text>

        <View style={s.earningsCard}>
          <Text style={s.earningsTotal}>{fmtPrice(earningsTotal)}</Text>
          <Text style={s.earningsSub}>
            {earningsCount} JOB{earningsCount !== 1 ? 'S' : ''} {'\u00b7'} MON{'\u2013'}SUN
          </Text>
        </View>

        {/* ── Section 3: Job History ── */}
        <Text style={s.sectionEyebrow}>JOB HISTORY</Text>

        {history.length === 0 ? (
          <Text style={s.emptyLine}>No completed jobs yet.</Text>
        ) : (
          history.map((job, i) => {
            const isWorker = job.worker_id === userId;
            const value = isWorker
              ? (job.worker_payout ?? job.agreed_price ?? 0)
              : (job.amount ?? job.agreed_price ?? 0);
            return (
              <View
                key={job.id}
                style={[s.historyRow, i < history.length - 1 && s.historyRowBorder]}
              >
                <Text style={s.historyDate}>
                  {job.completed_at ? fmtReceiptDate(job.completed_at) : '\u2014'}
                </Text>
                <View style={s.historyDesc}>
                  <Text style={s.historyTitle} numberOfLines={1}>{job.title}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/job/${job.id}/receipt` as any)}
                    activeOpacity={0.7}
                    accessibilityLabel={`View receipt for ${job.title}`}
                  >
                    <Text style={s.historyReceipt}>{'\u25B8'} RECEIPT</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.historyValueCol}>
                  <Text style={[s.historyValue, isWorker && s.historyValueEarned]}>
                    {isWorker ? '+' : ''}{fmtPrice(value)}
                  </Text>
                  <Text style={[s.historyDirection, isWorker ? s.dirEarned : s.dirSpent]}>
                    {isWorker ? 'EARNED' : 'PAID'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Masthead
  eyebrow: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.gold,
    marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  edition: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },

  // Section eyebrows
  sectionEyebrow: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.gold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Empty
  emptyLine: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },

  // Active cards
  activeCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  roleTag: {
    fontFamily: Fonts.displayB,
    fontSize: 8.5,
    letterSpacing: 2,
  },
  roleTagGreen: { color: Colors.green },
  roleTagAmber: { color: Colors.amber },
  roleTagBlue: { color: Colors.blue },
  activeTitle: {
    fontFamily: Fonts.bodyMed,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  activeFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  activeMeta: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  activePrice: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },

  // Earnings
  earningsCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  earningsTotal: {
    fontFamily: Fonts.heading,
    fontSize: 38,
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  earningsSub: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.textSecondary,
  },

  // Job history
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    gap: 8,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyDate: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    color: Colors.textSecondary,
    width: 58,
    letterSpacing: 0.5,
  },
  historyDesc: {
    flex: 1,
    gap: 3,
  },
  historyTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  historyReceipt: {
    fontFamily: Fonts.display,
    fontSize: 8.5,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  historyValueCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyValue: {
    fontFamily: Fonts.heading,
    fontSize: 13.5,
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },
  historyValueEarned: {
    color: Colors.green,
  },
  historyDirection: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
  dirEarned: { color: Colors.green },
  dirSpent: { color: Colors.textSecondary },
});
