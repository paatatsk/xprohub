import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// Screen 13 — Live Market
// Two-feed toggle: Jobs Feed | Workers Feed
// Step 3B: Jobs Feed wired to Supabase jobs table (status = 'open', newest first)
// TODO Step 3B: Workers Feed — profiles + worker_skills business card wall
// TODO Step 3C: category_id query param → filter both feeds

type Feed = 'jobs' | 'workers';

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  neighborhood: string | null;
  timing: string | null;
  is_urgent: boolean;
  created_at: string;
}

function timingLabel(timing: string | null): string {
  if (timing === 'asap')      return 'ASAP';
  if (timing === 'scheduled') return 'Scheduled';
  if (timing === 'flexible')  return 'Flexible';
  return '';
}

function budgetLabel(min: number | null, max: number | null): string {
  if (min && max) return `$${min}–$${max}`;
  if (min)        return `From $${min}`;
  if (max)        return `Up to $${max}`;
  return 'Budget TBD';
}

function JobCard({ job }: { job: Job }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{job.title}</Text>
        {job.is_urgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>

      {job.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{job.description}</Text>
      ) : null}

      <View style={styles.cardMeta}>
        <Text style={styles.cardBudget}>{budgetLabel(job.budget_min, job.budget_max)}</Text>
        <View style={styles.cardTags}>
          {job.neighborhood ? (
            <Text style={styles.cardTag}>📍 {job.neighborhood}</Text>
          ) : null}
          {job.timing ? (
            <Text style={styles.cardTag}>🕐 {timingLabel(job.timing)}</Text>
          ) : null}
          {job.category ? (
            <Text style={styles.cardTag}>{job.category}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function MarketScreen() {
  const router = useRouter();
  const [activeFeed, setActiveFeed] = useState<Feed>('jobs');
  const { category_id } = useLocalSearchParams<{ category_id?: string }>();

  // Jobs feed state
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('jobs')
      .select('id, title, description, category, budget_min, budget_max, neighborhood, timing, is_urgent, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (err) {
      setError(err.message);
    } else {
      setJobs(data ?? []);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const renderJobsContent = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIconGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>COULDN'T LOAD JOBS</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchJobs()}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={jobs.length === 0 ? styles.fillCenter : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchJobs(true)}
            tintColor={Colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconRing}>
              <Text style={styles.emptyIconGlyph}>📋</Text>
            </View>
            <Text style={styles.emptyHeading}>NO JOBS POSTED YET</Text>
            <Text style={styles.emptySub}>Be the first to post a job</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* ── Toggle ── */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeFeed === 'jobs' && styles.toggleBtnActive]}
          onPress={() => setActiveFeed('jobs')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeFeed === 'jobs' && styles.toggleTextActive]}>
            JOBS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeFeed === 'workers' && styles.toggleBtnActive]}
          onPress={() => setActiveFeed('workers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeFeed === 'workers' && styles.toggleTextActive]}>
            WORKERS
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Jobs feed ── */}
      {activeFeed === 'jobs' && renderJobsContent()}

      {/* ── Workers feed — empty state (unchanged from 3A) ── */}
      {activeFeed === 'workers' && (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconRing}>
            <Text style={styles.emptyIconGlyph}>👷</Text>
          </View>
          <Text style={styles.emptyHeading}>NO WORKERS LISTED YET</Text>
          <Text style={styles.emptySub}>Check back soon — workers joining daily</Text>
        </View>
      )}

      {/* ── FAB — Jobs feed only ── */}
      {activeFeed === 'jobs' && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => {
            // TODO 4C: gate check → Level 2 gate before navigating
            router.push(
              category_id
                ? `/(tabs)/post?category_id=${category_id}`
                : '/(tabs)/post'
            );
          }}
        >
          <Text style={styles.fabText}>+ POST A JOB</Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.gold,
  },
  toggleText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  toggleTextActive: {
    color: Colors.background,
  },

  // Layout helpers
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
    paddingBottom: 100, // space for FAB
  },

  // Empty / error states
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

  // Job card
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
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
  urgentBadge: {
    backgroundColor: Colors.red,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cardMeta: {
    gap: 6,
  },
  cardBudget: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTag: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  fabText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
});
