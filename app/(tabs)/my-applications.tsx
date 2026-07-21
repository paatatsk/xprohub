// app/(tabs)/my-applications.tsx
// Screen — Worker's submitted applications (bid history) across all jobs.
// Symmetric to my-jobs.tsx but for the worker side.

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

interface EmbeddedJob {
  id: string;
  title: string;
  category: string | null;
  status: string;
  customer_id: string | null;
}

interface Bid {
  id: string;
  status: string;
  proposed_price: number | null;
  message: string | null;
  created_at: string;
  is_direct_offer: boolean;
  job: EmbeddedJob | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Bid status — what happened to this application
function bidStatusColor(status: string): string {
  switch (status) {
    case 'pending':   return Colors.gold;
    case 'accepted':  return Colors.green;
    case 'declined':  return Colors.textSecondary;
    case 'withdrawn': return Colors.textSecondary;
    default:          return Colors.textSecondary;
  }
}

function bidStatusLabel(status: string): string {
  switch (status) {
    case 'pending':   return 'PENDING';
    case 'accepted':  return 'ACCEPTED';
    case 'declined':  return 'RELEASED';
    case 'withdrawn': return 'WITHDRAWN';
    default:          return status.toUpperCase();
  }
}

// Job status — the underlying job's lifecycle state
function jobStatusColor(status: string): string {
  switch (status) {
    case 'open':                  return Colors.gold;
    case 'matched':               return Colors.green;
    case 'in_progress':           return Colors.amber;
    case 'pending_confirmation':  return Colors.amber;
    case 'completed':             return Colors.textSecondary;
    case 'disputed':              return Colors.red;
    default:                      return Colors.textSecondary;
  }
}

function jobStatusLabel(status: string): string {
  switch (status) {
    case 'open':                  return 'OPEN';
    case 'matched':               return 'MATCHED';
    case 'in_progress':           return 'IN PROGRESS';
    case 'pending_confirmation':  return 'AWAITING CONFIRMATION';
    case 'completed':             return 'COMPLETED';
    case 'disputed':              return 'DISPUTED';
    default:                      return status.toUpperCase();
  }
}

// ── ApplicationCard ────────────────────────────────────────────────────────

interface ApplicationCardProps {
  bid: Bid;
  customerName: string | null; // only populated for accepted bids
  actionLoading: boolean;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

function ApplicationCard({ bid, customerName, actionLoading, onPress, onAccept, onDecline }: ApplicationCardProps) {
  const isDirectPending = bid.is_direct_offer && bid.status === 'pending';
  const bidColor   = isDirectPending ? Colors.gold : bidStatusColor(bid.status);
  const bidLabel   = isDirectPending ? 'DIRECT OFFER' : bidStatusLabel(bid.status);
  const job        = bid.job;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Title row + bid status badge ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {job?.title ?? 'Job no longer available'}
        </Text>
        <View style={[styles.statusBadge, { borderColor: bidColor }]}>
          <Text style={[styles.statusText, { color: bidColor }]}>{bidLabel}</Text>
        </View>
      </View>

      {/* ── Category pill + job status pill ── */}
      <View style={styles.pillRow}>
        {job?.category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{job.category}</Text>
          </View>
        ) : null}
        {job?.status ? (
          <View style={[styles.jobStatusPill, { borderColor: jobStatusColor(job.status) }]}>
            <Text style={[styles.jobStatusText, { color: jobStatusColor(job.status) }]}>
              {jobStatusLabel(job.status)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Customer line (privacy-gated) ── */}
      <Text style={styles.customerLine}>
        For:{' '}
        <Text style={bid.status === 'accepted' ? styles.customerNameAccepted : styles.customerNameHidden}>
          {bid.status === 'accepted' && customerName ? customerName : 'Customer'}
        </Text>
      </Text>

      {/* ── Proposed price ── */}
      {bid.proposed_price != null && (
        <Text style={styles.price}>${bid.proposed_price.toFixed(0)}</Text>
      )}

      {/* ── Submitted message ── */}
      {bid.message ? (
        <Text style={styles.message} numberOfLines={2}>{bid.message}</Text>
      ) : null}

      {/* ── Footer: timeAgo ── */}
      <View style={styles.cardFooter}>
        <Text style={styles.timeAgo}>{timeAgo(bid.created_at)}</Text>
      </View>

      {/* ── Accept / Decline buttons (direct offers only) ── */}
      {isDirectPending && (
        <View style={styles.actionRow}>
          {actionLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
          ) : (
            <>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={onAccept}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptBtnText}>ACCEPT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={onDecline}
                activeOpacity={0.85}
              >
                <Text style={styles.declineBtnText}>DECLINE</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function MyApplicationsScreen() {
  const router = useRouter();

  const [bids,            setBids]            = useState<Bid[]>([]);
  const [customerNameMap, setCustomerNameMap] = useState<Record<string, string>>({});
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadApplications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    // Step 1 — current user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      setError('You must be signed in to view your applications.');
      if (isRefresh) setRefreshing(false);
      else           setLoading(false);
      return;
    }

    // Step 2 — fetch worker's bids with embedded job context
    const { data: bidRows, error: bidErr } = await supabase
      .from('bids')
      .select(`
        id, status, proposed_price, message, created_at, is_direct_offer,
        job:jobs!job_id(id, title, category, status, customer_id)
      `)
      .eq('worker_id', user.id)
      .order('created_at', { ascending: false });

    if (bidErr) {
      setError('Couldn\u2019t load your applications. Pull down to try again.');
      if (isRefresh) setRefreshing(false);
      else           setLoading(false);
      return;
    }

    const rows = (bidRows ?? []) as unknown as Bid[];
    setBids(rows);

    // Step 3 — second query for customer names on accepted bids only.
    // Privacy: we only reveal the customer's identity after acceptance.
    const acceptedCustomerIds = rows
      .filter(b => b.status === 'accepted' && b.job?.customer_id)
      .map(b => b.job!.customer_id as string);

    if (acceptedCustomerIds.length > 0) {
      const { data: profileRows, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', acceptedCustomerIds);

      if (!profileErr && profileRows) {
        const nameMap: Record<string, string> = {};
        for (const p of profileRows) {
          if (p.full_name) nameMap[p.id] = p.full_name;
        }
        setCustomerNameMap(nameMap);
      }
      // If profileErr: silently degrade — "Customer" fallback handles it
    }

    if (isRefresh) setRefreshing(false);
    else           setLoading(false);
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  // ── Refetch when screen regains focus (new offers may have arrived) ────────

  useFocusEffect(useCallback(() => { loadApplications(); }, [loadApplications]));

  // ── Action state for direct-offer accept/decline ──────────────────────────

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // ── Accept direct offer ───────────────────────────────────────────────────

  const handleAcceptOffer = useCallback((bid: Bid) => {
    const price = bid.proposed_price?.toFixed(0) ?? '0';
    Alert.alert(
      'Accept this job?',
      `Accept for $${price}? The customer will be charged and the job becomes yours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [bid.id]: true }));
            try {
              const { data, error: fnError } = await supabase.functions.invoke(
                'hire-and-charge',
                { body: { bid_id: bid.id } },
              );

              if (fnError) {
                Alert.alert('Something went wrong', fnError.message ?? 'Please try again.');
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                await loadApplications(true);
                return;
              }

              if (data?.error === 'customer_payment_issue') {
                Alert.alert('Payment Issue', data.message ?? "The customer's payment couldn't be processed.");
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                await loadApplications(true);
                return;
              }

              if (data?.error) {
                Alert.alert('Could not accept', data.message ?? 'Please try again.');
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                await loadApplications(true);
                return;
              }

              // Success — navigate to chat
              setActionLoading(prev => ({ ...prev, [bid.id]: false }));
              const chatId = data?.chat_id as string | null;
              if (chatId) {
                router.push(`/(tabs)/job-chat?chat_id=${chatId}` as any);
              }
              await loadApplications(true);
            } catch {
              Alert.alert('Something went wrong', 'Please try again.');
              setActionLoading(prev => ({ ...prev, [bid.id]: false }));
              await loadApplications(true);
            }
          },
        },
      ],
    );
  }, [loadApplications, router]);

  // ── Decline direct offer ──────────────────────────────────────────────────

  const handleDeclineOffer = useCallback((bid: Bid) => {
    Alert.alert(
      'Decline this request?',
      'The job will be closed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [bid.id]: true }));
            const { error: rpcErr } = await supabase
              .rpc('decline_direct_offer', { p_bid_id: bid.id });
            setActionLoading(prev => ({ ...prev, [bid.id]: false }));
            if (rpcErr) {
              Alert.alert('Could not decline', rpcErr.message ?? 'Please try again.');
            }
            await loadApplications(true);
          },
        },
      ],
    );
  }, [loadApplications]);

  // ── Navigation handler ────────────────────────────────────────────────────

  const handlePress = useCallback(async (bid: Bid) => {
    if (!bid.job) return; // job deleted or unavailable — no-op

    if (bid.status === 'accepted') {
      // Look up the chat row for this job so we can pass chat_id
      const { data: chatRow, error: chatErr } = await supabase
        .from('chats')
        .select('id')
        .eq('job_id', bid.job.id)
        .maybeSingle();

      if (!chatErr && chatRow?.id) {
        router.push(`/(tabs)/job-chat?chat_id=${chatRow.id}` as any);
      } else {
        // Chat row missing — fall back to job detail
        router.push(`/(tabs)/job-detail?job_id=${bid.job.id}` as any);
      }
      return;
    }

    router.push(`/(tabs)/job-detail?job_id=${bid.job.id}` as any);
  }, [router]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIconGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>COULDN'T LOAD APPLICATIONS</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadApplications()}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main JSX ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ApplicationCard
            bid={item}
            customerName={
              item.job?.customer_id ? (customerNameMap[item.job.customer_id] ?? null) : null
            }
            actionLoading={actionLoading[item.id] ?? false}
            onPress={() => handlePress(item)}
            onAccept={item.is_direct_offer && item.status === 'pending' ? () => handleAcceptOffer(item) : undefined}
            onDecline={item.is_direct_offer && item.status === 'pending' ? () => handleDeclineOffer(item) : undefined}
          />
        )}
        contentContainerStyle={
          bids.length === 0 ? styles.fillCenter : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadApplications(true)}
            tintColor={Colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconRing}>
              <Text style={styles.emptyIconGlyph}>📝</Text>
            </View>
            <Text style={styles.emptyHeading}>NO APPLICATIONS YET</Text>
            <Text style={styles.emptySub}>
              Browse open jobs and apply — your applications will appear here.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.push('/(tabs)/market')}
            >
              <Text style={styles.retryText}>BROWSE JOBS</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Layout ────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  fillCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },

  // ── Application card ──────────────────────────────────────────
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },

  // ── Bid status badge ──────────────────────────────────────────
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // ── Pill row ──────────────────────────────────────────────────
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: Fonts.body,
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  jobStatusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // ── Customer line ─────────────────────────────────────────────
  customerLine: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  customerNameAccepted: {
    color: Colors.gold,
    fontWeight: '600',
  },
  customerNameHidden: {
    color: Colors.textSecondary,
  },

  // ── Price ─────────────────────────────────────────────────────
  price: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // ── Message ───────────────────────────────────────────────────
  message: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Card footer ───────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timeAgo: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyInner: {
    alignItems: 'center',
    gap: 16,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyIconGlyph: {
    fontSize: 36,
  },
  emptyHeading: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Accept / Decline action row (direct offers) ───────────────
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: 'center',
  },
  declineBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  // ── Retry / action button ─────────────────────────────────────
  retryBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
