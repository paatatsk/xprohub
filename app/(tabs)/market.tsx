import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
  ActionSheetIOS, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { strings } from '../../constants/strings';
import { supabase } from '../../lib/supabase';
import { useTrustLevel } from '../../hooks/useTrustLevel';
import { useBlockList } from '../../hooks/useBlockList';
import WorkerCardComponent, { type Worker } from '../../components/WorkerCard';
import JobCardComponent, { type Job } from '../../components/JobCard';

// Screen 13 — Live Market (Two Markets redesign)
// Jobs Feed + Laborers Feed, both wired to Supabase
// Card components extracted to components/JobCard.tsx + components/WorkerCard.tsx

type Feed = 'jobs' | 'workers';

// ── Screen ─────────────────────────────────────────────────────

export default function MarketScreen() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold_Italic,
    Oswald_600SemiBold,
    Oswald_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const router = useRouter();
  const [activeFeed, setActiveFeed] = useState<Feed>('jobs');
  const { category_id } = useLocalSearchParams<{ category_id?: string }>();
  const { trustLevel } = useTrustLevel();
  const { blockedIds, currentUserId, refresh: refreshBlocks } = useBlockList();

  // Category filter state (name resolved for display + Jobs Feed .eq())
  const [categoryName, setCategoryName] = useState<string | null>(null);

  // Jobs feed state
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Workers feed state
  const [workers, setWorkers]                     = useState<Worker[]>([]);
  const [workersLoading, setWorkersLoading]       = useState(true);
  const [workersRefreshing, setWorkersRefreshing] = useState(false);
  const [workersError, setWorkersError]           = useState<string | null>(null);

  // Resolve category name from id — used for filter strip label + Jobs Feed .eq()
  useEffect(() => {
    if (!category_id) {
      setCategoryName(null);
      return;
    }
    supabase
      .from('task_categories')
      .select('name')
      .eq('id', Number(category_id))
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setCategoryName(data?.name ?? null);
      });
  }, [category_id]);

  // ── Fetch Jobs ───────────────────────────────────────────────

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    let query = supabase
      .from('jobs')
      .select('id, title, description, category, budget_min, budget_max, neighborhood, timing, is_urgent, created_at, customer_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (categoryName) {
      query = query.eq('category', categoryName);
    }

    const { data, error: err } = await query;

    if (err) {
      setError('Couldn\u2019t load jobs. Pull down to try again.');
    } else {
      const excluded = new Set([...blockedIds, ...(currentUserId ? [currentUserId] : [])]);
      setJobs((data ?? []).filter(j => !excluded.has(j.customer_id)));
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [categoryName, blockedIds, currentUserId]);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  // ── Fetch Workers ────────────────────────────────────────────
  // RLS confirmed applied: migration 20260419000002_enable_worker_skills_rls.sql
  // worker_skills has public SELECT + self-write policies as of 2026-04-19.

  const fetchWorkers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setWorkersRefreshing(true);
    else setWorkersLoading(true);
    setWorkersError(null);

    // Step 1: if category filter active, resolve task_ids in that category
    let taskIdFilter: number[] | null = null;
    if (category_id) {
      const { data: taskRows } = await supabase
        .from('task_library')
        .select('id')
        .eq('category_id', Number(category_id))
        .eq('is_active', true);
      taskIdFilter = taskRows?.map(r => r.id) ?? [];
      if (taskIdFilter.length === 0) {
        // No tasks exist in this category — no workers to show
        setWorkers([]);
        if (isRefresh) setWorkersRefreshing(false);
        else setWorkersLoading(false);
        return;
      }
    }

    // Step 2: query worker_skills with profile + task name joins.
    // Ordered featured-first so superpowers appear at the head of each
    // worker's rows during client-side aggregation.
    // Limit 300 rows ≈ comfortable for 50–100 workers at current scale.
    let query = supabase
      .from('worker_skills')
      .select(`
        user_id,
        is_featured,
        task_library ( name ),
        profiles ( id, full_name, avatar_url, bio, jobs_completed, endorsement_count, city, worker_status, today_rate_min, today_rate_max, today_radius_mi, today_skills, created_at )
      `)
      .order('is_featured', { ascending: false })
      .limit(300);

    if (taskIdFilter !== null) {
      query = query.in('task_id', taskIdFilter);
    }

    const { data: rows, error: err } = await query;

    if (err) {
      setWorkersError('Couldn\u2019t load workers. Pull down to try again.');
    } else {
      // Aggregate by user_id — each worker appears once, superpowers
      // built from the first 3 is_featured rows encountered.
      const workerMap = new Map<string, Worker>();

      for (const row of (rows ?? [])) {
        const profile = row.profiles as unknown as {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          jobs_completed: number | null;
          endorsement_count: number | null;
          city: string | null;
          worker_status: string | null;
          today_rate_min: number | null;
          today_rate_max: number | null;
          today_radius_mi: number | null;
          today_skills: string[] | null;
          created_at: string;
        } | null;

        if (!profile) continue;

        if (!workerMap.has(row.user_id)) {
          workerMap.set(row.user_id, {
            id: profile.id,
            full_name: profile.full_name ?? 'Anonymous',
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            superpowers: [],
            worker_status: (profile.worker_status as Worker['worker_status']) ?? 'offline',
            today_rate_min: profile.today_rate_min,
            today_rate_max: profile.today_rate_max,
            today_radius_mi: profile.today_radius_mi,
            today_skills: profile.today_skills ?? [],
            jobs_completed: profile.jobs_completed ?? 0,
            endorsement_count: profile.endorsement_count ?? 0,
            neighborhood: profile.city,
            created_at: profile.created_at,
          });
        }

        const worker = workerMap.get(row.user_id)!;
        if (row.is_featured && worker.superpowers.length < 3) {
          const tl = row.task_library as unknown as { name: string } | null;
          if (tl?.name) worker.superpowers.push(tl.name);
        }
      }

      const excluded = new Set([...blockedIds, ...(currentUserId ? [currentUserId] : [])]);
      setWorkers(Array.from(workerMap.values()).filter(w => !excluded.has(w.id)));
    }

    if (isRefresh) setWorkersRefreshing(false);
    else setWorkersLoading(false);
  }, [category_id, blockedIds, currentUserId]);

  useFocusEffect(useCallback(() => { fetchWorkers(); }, [fetchWorkers]));

  // ── Clear filter ─────────────────────────────────────────────

  const clearFilter = () => { router.replace('/(tabs)/market'); };

  // ── Filter strip ─────────────────────────────────────────────

  const renderFilterStrip = () => {
    if (!categoryName) return null;
    return (
      <View style={styles.filterStrip}>
        <View style={styles.filterAccent} />
        <Text style={styles.filterText}>Showing: {categoryName}</Text>
        <TouchableOpacity onPress={clearFilter} activeOpacity={0.7}>
          <Text style={styles.filterClear}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Render Jobs content ──────────────────────────────────────

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

    const emptyLabel = categoryName
      ? `No ${categoryName} jobs posted yet`
      : 'Be the first to post a job';

    return (
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <JobCardComponent
              job={item}
              onPress={() => router.push(`/(tabs)/job-detail?job_id=${item.id}` as any)}
            />
          )}
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
            <Text style={styles.emptySub}>{emptyLabel}</Text>
          </View>
        }
      />
    );
  };

  // ── Render Workers content ───────────────────────────────────

  const renderWorkersContent = () => {
    if (workersLoading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      );
    }

    if (workersError) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIconGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>COULDN'T LOAD TALENT</Text>
          <Text style={styles.emptySub}>{workersError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchWorkers()}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const emptyLabel = categoryName
      ? `No ${categoryName} talent yet`
      : strings['feed.empty.laborers'];

    return (
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkerCardComponent
            worker={item}
            onHire={() => {
              const hireDest =
                `/(tabs)/direct-hire?worker_id=${item.id}` +
                `&worker_name=${encodeURIComponent(item.full_name)}`;
              if (trustLevel === 'explorer') {
                router.push(`/(onboarding)/verify-level-2?destination=${encodeURIComponent(hireDest)}` as any);
              } else {
                router.push(hireDest as any);
              }
            }}
            onOverflow={() => {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  title: item.full_name,
                  options: ['Report User', 'Block User', 'Cancel'],
                  destructiveButtonIndex: 1,
                  cancelButtonIndex: 2,
                  userInterfaceStyle: 'dark',
                },
                async (buttonIndex) => {
                  if (buttonIndex === 0) {
                    router.push(
                      `/(tabs)/report?reported_user_id=${item.id}` +
                      `&content_type=user` +
                      `&reported_user_name=${encodeURIComponent(item.full_name)}` as any
                    );
                  } else if (buttonIndex === 1) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      Alert.alert('Session expired', 'Please sign in again.');
                      return;
                    }
                    const { error } = await supabase
                      .from('user_blocks')
                      .insert({ blocker_id: user.id, blocked_id: item.id });
                    if (error) {
                      if (error.code === '23505') {
                        // Already blocked — treat as success
                        await refreshBlocks();
                      } else {
                        Alert.alert('Block Failed', "Couldn't block this user. Please try again.");
                      }
                    } else {
                      await refreshBlocks();
                    }
                  }
                },
              );
            }}
          />
        )}
        contentContainerStyle={workers.length === 0 ? styles.fillCenter : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={workersRefreshing}
            onRefresh={() => fetchWorkers(true)}
            tintColor={Colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconRing}>
              <Text style={styles.emptyIconGlyph}>👷</Text>
            </View>
            <Text style={styles.emptyHeading}>NO TALENT LISTED YET</Text>
            <Text style={styles.emptySub}>{emptyLabel}</Text>
          </View>
        }
      />
    );
  };

  // ── JSX ──────────────────────────────────────────────────────

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
            {strings['toggle.laborers']}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Anchored post bar (both feeds) ── */}
      <TouchableOpacity
        style={styles.postBar}
        activeOpacity={0.85}
        onPress={() => {
          const dest = category_id
            ? `/(tabs)/post?category_id=${category_id}`
            : '/(tabs)/post';
          if (trustLevel === 'explorer') {
            router.push(`/(onboarding)/verify-level-2?destination=${encodeURIComponent(dest)}` as any);
          } else {
            router.push(dest as any);
          }
        }}
        accessibilityLabel="Post a job"
        accessibilityRole="button"
      >
        <Text style={styles.postBarText}>+ POST A JOB</Text>
      </TouchableOpacity>

      {/* ── Category filter strip — both feeds ── */}
      {renderFilterStrip()}

      {/* ── Feeds ── */}
      {activeFeed === 'jobs'    && renderJobsContent()}
      {activeFeed === 'workers' && renderWorkersContent()}

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

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

  // Filter strip
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    gap: 10,
  },
  filterAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: Colors.gold,
  },
  filterText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 10,
  },
  filterClear: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingRight: 14,
    letterSpacing: 0.5,
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
    paddingBottom: 100,
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
    fontFamily: Fonts.body,
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

  // Anchored post bar
  postBar: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  postBarText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1.5,
    color: Colors.background,
  },
});
