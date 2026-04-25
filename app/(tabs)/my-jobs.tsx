// app/(tabs)/my-jobs.tsx
// Screen — Customer's posted jobs list with bid counts and status.
// Tapping a card routes to /(tabs)/job-bids?job_id=<id>.

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  category: string | null;
  status: string;
  created_at: string;
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

function statusColor(status: string): string {
  switch (status) {
    case 'open':        return Colors.gold;
    case 'matched':     return Colors.green;
    case 'in_progress': return '#E5901A'; // amber — no theme token
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

// ── JobCard ────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: Job;
  bidCount: number;
  onPress: () => void;
}

function JobCard({ job, bidCount, onPress }: JobCardProps) {
  const color = statusColor(job.status);
  const label = statusLabel(job.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Title row + status badge ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
        <View style={[styles.statusBadge, { borderColor: color }]}>
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      {/* ── Category pill ── */}
      {job.category ? (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{job.category}</Text>
        </View>
      ) : null}

      {/* ── Footer: bid count + timeAgo ── */}
      <View style={styles.cardFooter}>
        {bidCount === 0 ? (
          <Text style={styles.noBids}>No applications yet</Text>
        ) : (
          <Text style={styles.bidCount}>
            {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
          </Text>
        )}
        <Text style={styles.timeAgo}>{timeAgo(job.created_at)}</Text>
      </View>

    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function MyJobsScreen() {
  const router = useRouter();

  const [jobs,         setJobs]         = useState<Job[]>([]);
  const [bidCountMap,  setBidCountMap]  = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    // Step 1 — current user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      setError('You must be signed in to view your jobs.');
      if (isRefresh) setRefreshing(false);
      else           setLoading(false);
      return;
    }

    // Step 2 — fetch this customer's posted jobs
    const { data: jobRows, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, category, status, created_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (jobErr) {
      setError(jobErr.message);
      if (isRefresh) setRefreshing(false);
      else           setLoading(false);
      return;
    }

    const rows = jobRows ?? [];
    setJobs(rows);

    // Step 3 — single batch query for bid counts across all jobs.
    // Avoids N+1: fetch all matching bids, aggregate client-side.
    if (rows.length > 0) {
      const ids = rows.map(j => j.id);
      const { data: bidRows, error: bidErr } = await supabase
        .from('bids')
        .select('job_id')
        .in('job_id', ids);

      if (!bidErr && bidRows) {
        const counts: Record<string, number> = {};
        for (const b of bidRows) {
          counts[b.job_id] = (counts[b.job_id] ?? 0) + 1;
        }
        setBidCountMap(counts);
      }
      // If bidErr: silently show 0 counts — non-fatal
    }

    if (isRefresh) setRefreshing(false);
    else           setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

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
          <Text style={styles.emptyHeading}>COULDN'T LOAD JOBS</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadJobs()}>
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
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            bidCount={bidCountMap[item.id] ?? 0}
            onPress={() => router.push(`/(tabs)/job-bids?job_id=${item.id}` as any)}
          />
        )}
        contentContainerStyle={
          jobs.length === 0 ? styles.fillCenter : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadJobs(true)}
            tintColor={Colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconRing}>
              <Text style={styles.emptyIconGlyph}>🚧</Text>
            </View>
            <Text style={styles.emptyHeading}>NO JOBS POSTED YET</Text>
            <Text style={styles.emptySub}>
              Post your first job and workers will start applying.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Text style={styles.retryText}>POST A JOB</Text>
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

  // ── Job card ──────────────────────────────────────────────────
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

  // ── Status badge ──────────────────────────────────────────────
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

  // ── Category pill ─────────────────────────────────────────────
  categoryPill: {
    alignSelf: 'flex-start',
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

  // ── Card footer ───────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidCount: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
  },
  noBids: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  timeAgo: {
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
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
