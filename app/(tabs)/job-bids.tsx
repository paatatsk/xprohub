// app/(tabs)/job-bids.tsx
// Screen — Customer reviews, accepts, and declines bids on a specific job.
// URL param: job_id (uuid)

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { handleNextAction } from '@stripe/stripe-react-native';

// ── Types ──────────────────────────────────────────────────────────────────

interface JobContext {
  id: string;
  title: string;
  category: string | null;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  customer_id: string;
}

interface BidWorker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  belt_level: string | null;
}

interface BidWithWorker {
  id: string;
  job_id: string;
  worker_id: string;
  proposed_price: number;
  message: string | null;
  status: string;
  created_at: string;
  worker: BidWorker | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Job-level status color + label (for the context strip)
function statusColor(status: string): string {
  switch (status) {
    case 'open':        return Colors.gold;
    case 'matched':     return Colors.green;
    case 'in_progress': return '#E5901A'; // amber
    case 'completed':   return Colors.textSecondary;
    default:            return Colors.textSecondary;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'open':        return 'OPEN';
    case 'matched':     return 'MATCHED';
    case 'in_progress': return 'IN PROGRESS';
    case 'completed':   return 'COMPLETED';
    default:            return status.toUpperCase();
  }
}

function beltLabel(belt: string | null): string {
  if (!belt || belt === 'white') return '';
  return belt.charAt(0).toUpperCase() + belt.slice(1) + ' Belt';
}

function budgetLabel(min: number | null, max: number | null): string {
  if (min && max) return `$${min}–$${max}`;
  if (min)        return `From $${min}`;
  if (max)        return `Up to $${max}`;
  return 'Budget TBD';
}

// ── Bid sort order ─────────────────────────────────────────────────────────
// pending first, then accepted, declined, withdrawn

const BID_SORT: Record<string, number> = {
  pending:   0,
  accepted:  1,
  declined:  2,
  withdrawn: 3,
};

// ── BidCard ────────────────────────────────────────────────────────────────

interface BidCardProps {
  bid: BidWithWorker;
  actionLoading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onOpenChat: () => void;
}

function BidCard({ bid, actionLoading, onAccept, onDecline, onOpenChat }: BidCardProps) {
  const worker   = bid.worker;
  const isDimmed = bid.status === 'declined' || bid.status === 'withdrawn';

  const initials = worker?.full_name
    ? worker.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const belt = beltLabel(worker?.belt_level ?? null);

  return (
    <View style={[styles.bidCard, isDimmed && styles.bidCardDimmed]}>

      {/* ── Header: avatar + name + belt + price ── */}
      <View style={styles.bidHeader}>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {worker?.avatar_url ? (
            <Image source={{ uri: worker.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Name + belt stack */}
        <View style={styles.workerInfo}>
          <Text style={styles.workerName} numberOfLines={1}>
            {worker?.full_name ?? 'Unknown Worker'}
          </Text>
          {belt ? (
            <Text style={styles.workerBelt}>{belt}</Text>
          ) : null}
        </View>

        {/* Proposed price — loudest element */}
        <Text style={styles.proposedPrice}>
          ${bid.proposed_price.toLocaleString()}
        </Text>

      </View>

      {/* ── Message body ── */}
      {bid.message ? (
        <Text style={styles.bidMessage}>{bid.message}</Text>
      ) : (
        <Text style={styles.bidMessageEmpty}>No message provided.</Text>
      )}

      {/* ── Submitted time ── */}
      <Text style={styles.bidTime}>Submitted {timeAgo(bid.created_at)}</Text>

      {/* ── Conditional footer ── */}
      {bid.status === 'pending' && (
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

      {bid.status === 'accepted' && (
        <View style={styles.actionRow}>
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedBadgeText}>✓ ACCEPTED</Text>
          </View>
          <TouchableOpacity
            style={styles.openChatBtn}
            onPress={onOpenChat}
            activeOpacity={0.85}
          >
            <Text style={styles.openChatBtnText}>OPEN CHAT</Text>
          </TouchableOpacity>
        </View>
      )}

      {(bid.status === 'declined' || bid.status === 'withdrawn') && (
        <View style={styles.declinedBadge}>
          <Text style={styles.declinedBadgeText}>✗ DECLINED</Text>
        </View>
      )}

    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function JobBidsScreen() {
  const router = useRouter();
  const { job_id } = useLocalSearchParams<{ job_id: string }>();

  const [job,           setJob]           = useState<JobContext | null>(null);
  const [bids,          setBids]          = useState<BidWithWorker[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError,   setActionError]   = useState<string | null>(null);

  // ── Fetch bids only (used after decline to refresh list) ──────────────────

  const fetchBids = useCallback(async () => {
    if (!job_id) return;
    const { data, error: err } = await supabase
      .from('bids')
      .select('*, worker:profiles!worker_id(id, full_name, avatar_url, belt_level)')
      .eq('job_id', job_id)
      .order('created_at', { ascending: false });

    if (!err && data) {
      setBids(data.map(b => ({ ...b, worker: b.worker as BidWorker | null })));
    }
  }, [job_id]);

  // ── Initial load: auth + job + bids in parallel ───────────────────────────

  useEffect(() => {
    if (!job_id) {
      setLoadError('No job specified.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setLoadError(null);

      const [
        { data: { user }, error: authErr },
        { data: jobData,  error: jobErr  },
        { data: bidData,  error: bidErr  },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('jobs')
          .select('id, title, category, status, budget_min, budget_max, customer_id')
          .eq('id', job_id)
          .single(),
        supabase
          .from('bids')
          .select('*, worker:profiles!worker_id(id, full_name, avatar_url, belt_level)')
          .eq('job_id', job_id)
          .order('created_at', { ascending: false }),
      ]);

      if (authErr || !user) { setLoadError('Sign in required.'); setLoading(false); return; }
      if (jobErr || !jobData) { setLoadError('Job not found.'); setLoading(false); return; }
      if (bidErr) { setLoadError(bidErr.message); setLoading(false); return; }

      setCurrentUserId(user.id);
      setJob(jobData as JobContext);
      setBids((bidData ?? []).map(b => ({ ...b, worker: b.worker as BidWorker | null })));
      setLoading(false);
    })();
  }, [job_id]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isAuthorized = !!(job && currentUserId && job.customer_id === currentUserId);

  const sortedBids = [...bids].sort((a, b) =>
    (BID_SORT[a.status] ?? 99) - (BID_SORT[b.status] ?? 99)
  );

  const budgetStr = job ? budgetLabel(job.budget_min, job.budget_max) : '';

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAccept(bid: BidWithWorker) {
    const workerName = bid.worker?.full_name ?? 'Worker';
    const price = bid.proposed_price?.toFixed(2) ?? '0.00';

    Alert.alert(
      `Hire ${workerName}?`,
      `This charges your card $${price} and declines all other applications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hire & Charge',
          onPress: async () => {
            setActionError(null);
            setActionLoading(prev => ({ ...prev, [bid.id]: true }));

            try {
              // Step 1: invoke hire-and-charge Edge Function
              const { data, error: fnError } = await supabase.functions.invoke(
                'hire-and-charge',
                { body: { bid_id: bid.id } },
              );

              // Handle Edge Function invocation error (network, 5xx)
              if (fnError) {
                setActionError(fnError.message ?? 'Something went wrong. Please try again.');
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                return;
              }

              // Handle card_requires_action (SCA / 3DS)
              if (data?.error === 'card_requires_action' && data.client_secret) {
                const { error: nextActionErr } = await handleNextAction(
                  data.client_secret,
                  'xprohub://stripe-return',
                );

                if (nextActionErr) {
                  setActionError('Verification failed. Please try again or update your payment method.');
                  setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                  return;
                }

                // Step 2: resume hire with the verified PaymentIntent
                const { data: resumeData, error: resumeErr } = await supabase.functions.invoke(
                  'hire-and-charge',
                  { body: { bid_id: bid.id, payment_intent_id: data.payment_intent_id } },
                );

                if (resumeErr || resumeData?.error) {
                  setActionError(resumeData?.message ?? resumeErr?.message ?? 'Hire failed after verification.');
                  setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                  return;
                }

                // SCA resume succeeded — navigate to chat
                const resumeChatId = resumeData?.chat_id as string | null;
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                if (resumeChatId) {
                  router.replace(
                    `/(tabs)/job-chat?chat_id=${resumeChatId}&worker_name=${encodeURIComponent(workerName)}` as any
                  );
                } else {
                  await fetchBids();
                }
                return;
              }

              // Handle card_expired — route to payment-setup
              if (data?.error === 'card_expired') {
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                Alert.alert(
                  'Card Expired',
                  data.message ?? 'The card on file has expired. Please update your payment method.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Update Card',
                      onPress: () => router.push(
                        `/(tabs)/payment-setup?returnTo=${encodeURIComponent(`/(tabs)/job-bids?job_id=${job_id}`)}` as any
                      ),
                    },
                  ]
                );
                return;
              }

              // Handle no payment method — route to payment-setup
              if (
                data?.error === 'No Stripe customer on file. Please add a payment method first.' ||
                data?.error === 'No payment method on file. Please add a card first.'
              ) {
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                Alert.alert(
                  'Payment Method Required',
                  'Please add a card before hiring.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Set Up Payment',
                      onPress: () => router.push(
                        `/(tabs)/payment-setup?returnTo=${encodeURIComponent(`/(tabs)/job-bids?job_id=${job_id}`)}` as any
                      ),
                    },
                  ]
                );
                return;
              }

              // Handle other errors (card_declined, hire_failed, etc.)
              if (data?.error) {
                setActionError(data.message ?? 'Hire could not be completed. Please try again.');
                setActionLoading(prev => ({ ...prev, [bid.id]: false }));
                return;
              }

              // Success — navigate to chat
              const chatId = data?.chat_id as string | null;
              setActionLoading(prev => ({ ...prev, [bid.id]: false }));

              if (chatId) {
                router.replace(
                  `/(tabs)/job-chat?chat_id=${chatId}&worker_name=${encodeURIComponent(workerName)}` as any
                );
              } else {
                await fetchBids();
              }
            } catch (err) {
              console.error('[job-bids] handleAccept unexpected error:', err);
              setActionError('Something went wrong. Please try again.');
              setActionLoading(prev => ({ ...prev, [bid.id]: false }));
            }
          },
        },
      ]
    );
  }

  function handleDecline(bid: BidWithWorker) {
    Alert.alert(
      'Decline Application',
      'Decline this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionError(null);
            setActionLoading(prev => ({ ...prev, [bid.id]: true }));

            const { error: rpcErr } = await supabase
              .rpc('decline_bid', { p_bid_id: bid.id });

            setActionLoading(prev => ({ ...prev, [bid.id]: false }));

            if (rpcErr) { setActionError(rpcErr.message); return; }

            // Refetch — status flips to declined, card moves to bottom + dims
            await fetchBids();
          },
        },
      ]
    );
  }

  async function handleOpenChat(bid: BidWithWorker) {
    setActionError(null);
    setActionLoading(prev => ({ ...prev, [bid.id]: true }));

    const { data: chatRow, error: chatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('job_id', bid.job_id)
      .eq('worker_id', bid.worker_id)
      .single();

    setActionLoading(prev => ({ ...prev, [bid.id]: false }));

    if (chatErr || !chatRow) {
      setActionError('Could not find chat thread.');
      return;
    }

    const workerName = bid.worker?.full_name ?? 'Worker';
    router.push(
      `/(tabs)/job-chat?chat_id=${chatRow.id}&worker_name=${encodeURIComponent(workerName)}` as any
    );
  }

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

  // ── Load error state ──────────────────────────────────────────────────────

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIconGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>COULDN'T LOAD BIDS</Text>
          <Text style={styles.emptySub}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (!isAuthorized) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyIconGlyph}>🔒</Text>
          <Text style={styles.emptyHeading}>NOT AUTHORIZED</Text>
          <Text style={styles.emptySub}>You can only view bids on your own jobs.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main JSX ──────────────────────────────────────────────────────────────

  const jobColor = statusColor(job!.status);
  const jobLabel = statusLabel(job!.status);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Job context strip ── */}
        <View style={styles.contextCard}>
          <Text style={styles.contextEyebrow}>APPLICATIONS FOR</Text>
          <Text style={styles.contextTitle} numberOfLines={2}>{job!.title}</Text>
          <View style={styles.contextMeta}>
            {budgetStr ? (
              <Text style={styles.contextBudget}>{budgetStr}</Text>
            ) : null}
            {job!.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{job!.category}</Text>
              </View>
            ) : null}
            <View style={[styles.statusPill, { borderColor: jobColor }]}>
              <Text style={[styles.statusPillText, { color: jobColor }]}>{jobLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Action error banner ── */}
        {actionError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️  {actionError}</Text>
            <TouchableOpacity onPress={() => setActionError(null)}>
              <Text style={styles.errorBannerDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Bids list or empty state ── */}
        {sortedBids.length === 0 ? (
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconRing}>
              <Text style={styles.emptyIconGlyph}>📭</Text>
            </View>
            <Text style={styles.emptyHeading}>NO APPLICATIONS YET</Text>
            <Text style={styles.emptySub}>
              Workers will apply here. Check back soon.
            </Text>
          </View>
        ) : (
          sortedBids.map(bid => (
            <BidCard
              key={bid.id}
              bid={bid}
              actionLoading={actionLoading[bid.id] ?? false}
              onAccept={() => handleAccept(bid)}
              onDecline={() => handleDecline(bid)}
              onOpenChat={() => handleOpenChat(bid)}
            />
          ))
        )}

      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },

  // ── Job context strip ─────────────────────────────────────────
  contextCard: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  contextEyebrow: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  contextTitle: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 24,
  },
  contextMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  contextBudget: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 15,
  },
  categoryPill: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  statusPill: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // ── Action error banner ───────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 18,
  },
  errorBannerDismiss: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },

  // ── Bid card ──────────────────────────────────────────────────
  bidCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 10,
  },
  bidCardDimmed: {
    opacity: 0.5,
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Avatar
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: 44,
    height: 44,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Worker name + belt
  workerInfo: {
    flex: 1,
    gap: 2,
  },
  workerName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  workerBelt: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '600',
  },

  // Proposed price — loudest element
  proposedPrice: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.5,
  },

  // Message
  bidMessage: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  bidMessageEmpty: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Submitted time
  bidTime: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // ── Action row (shared container for pending + accepted) ──────
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },

  // Pending — ACCEPT
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  // Pending — DECLINE
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

  // Accepted — badge
  acceptedBadge: {
    flex: 1,
    backgroundColor: Colors.green,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: 'center',
  },
  acceptedBadgeText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  // Accepted — OPEN CHAT
  openChatBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: 'center',
  },
  openChatBtnText: {
    color: Colors.green,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.2,
  },

  // Declined / withdrawn — badge only
  declinedBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  declinedBadgeText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },

  // ── Empty / error states ──────────────────────────────────────
  emptyInner: {
    alignItems: 'center',
    gap: 16,
    marginTop: Spacing.xxl,
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
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
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
