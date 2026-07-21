// app/(tabs)/index.tsx
// Home — The launchpad. Fastest route into whichever flow you're starting.
// Per XPROHUB_DOCTRINE §6: "Home is a launchpad, not a dashboard to admire.
// It links into the flow; it does not render full lists or earnings showcases."

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useTrustLevel } from '../../hooks/useTrustLevel';
import { useBlockList } from '../../hooks/useBlockList';

// ── Types ────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  price_min: number;
  price_max: number;
  difficulty_range: string;
  sort_order: number;
  icon_slug: string;
  tier: number;
  requires_background_check: boolean;
}

type ListItem =
  | { type: 'masthead' }
  | { type: 'desk' }
  | { type: 'categories-label' }
  | { type: 'category'; data: Category; catIndex: number }
  | { type: 'endcap'; count: number }
  | { type: 'empty' };

// ── Helpers ──────────────────────────────────────────────────

function iconForSlug(slug: string): string {
  const map: Record<string, string> = {
    'home-cleaning': '\uD83E\uDDF9', 'errands-delivery': '\uD83D\uDCE6',
    'pet-care': '\uD83D\uDC15', 'child-care': '\uD83D\uDC76',
    'elder-care': '\uD83E\uDDD3', 'moving-labor': '\uD83D\uDE9A',
    'tutoring': '\uD83D\uDCDA', 'coaching': '\uD83C\uDFC6',
    'personal-asst': '\uD83D\uDDC2\uFE0F', 'vehicle-care': '\uD83D\uDE97',
    'handyman': '\uD83D\uDD28', 'gardening': '\uD83C\uDF3F',
    'trash-recycling': '\u267B\uFE0F', 'events': '\uD83C\uDF89',
    'electrical': '\u26A1', 'plumbing': '\uD83D\uDD27',
    'painting': '\uD83C\uDFA8', 'carpentry': '\uD83E\uDE9A',
    'it-tech': '\uD83D\uDCBB', 'hvac': '\u2744\uFE0F',
  };
  return map[slug] ?? '\u25AA';
}

// ── Launchpad Card ───────────────────────────────────────────

function LaunchpadCard({
  router, trustLevel, workerStatus, pendingBids, openApplications,
}: {
  router: ReturnType<typeof useRouter>;
  trustLevel: string | null;
  workerStatus: string;
  pendingBids: number;
  openApplications: number;
}) {
  const isLive = workerStatus === 'available';

  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>YOUR DESK</Text>

      {/* Row 1 — Post a job [INITIATE] */}
      <TouchableOpacity
        style={s.rowFirst}
        activeOpacity={0.7}
        onPress={() => {
          const dest = '/(tabs)/post';
          if (trustLevel === 'explorer') {
            router.push(`/(onboarding)/verify-level-2?destination=${encodeURIComponent(dest)}` as any);
          } else {
            router.push(dest as any);
          }
        }}
        accessibilityLabel="Post a job"
        accessibilityRole="button"
      >
        <View style={s.glyphFrame}><Text style={s.rowLeadGold}>+</Text></View>
        <Text style={s.rowLabel}>Post a job</Text>
      </TouchableOpacity>

      {/* Row 2 — Edit my card [INITIATE] */}
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/my-card')}
        accessibilityLabel="Edit my card"
        accessibilityRole="button"
      >
        <View style={s.glyphFrame}><View style={s.rowLeadSquare} /></View>
        <Text style={s.rowLabel}>Edit my card</Text>
        <View style={s.rowRight}>
          <View style={[s.statusDot, isLive ? s.statusLive : s.statusDraft]} />
          <Text style={[s.statusText, isLive ? s.statusLiveText : s.statusDraftText]}>
            {isLive ? 'LIVE' : 'DRAFT'}
          </Text>
          <Text style={s.chevron}>{'\u203A'}</Text>
        </View>
      </TouchableOpacity>

      {/* Row 3 — My posts [IN-FLOW] */}
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/my-jobs')}
        accessibilityLabel={`My posts, ${pendingBids} bids`}
        accessibilityRole="button"
      >
        <View style={s.glyphFrame}><Text style={s.rowLeadAmber}>{'\u25C6'}</Text></View>
        <Text style={s.rowLabel}>My posts</Text>
        <View style={s.rowRight}>
          {pendingBids > 0 && (
            <Text style={s.countAmber}>{pendingBids} {pendingBids === 1 ? 'BID' : 'BIDS'}</Text>
          )}
          <Text style={s.chevron}>{'\u203A'}</Text>
        </View>
      </TouchableOpacity>

      {/* Row 4 — My applications [IN-FLOW] */}
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/my-applications')}
        accessibilityLabel={`My applications, ${openApplications} open`}
        accessibilityRole="button"
      >
        <View style={s.glyphFrame}><View style={s.rowLeadGreenDot} /></View>
        <Text style={s.rowLabel}>My applications</Text>
        <View style={s.rowRight}>
          {openApplications > 0 && (
            <Text style={s.countGreen}>{openApplications} OPEN</Text>
          )}
          <Text style={s.chevron}>{'\u203A'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { trustLevel } = useTrustLevel();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Inter_600SemiBold,
    IBMPlexMono_400Regular,
    PlayfairDisplay_700Bold_Italic,
  });

  const { blockedIds } = useBlockList();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Masthead data
  const [firstName, setFirstName] = useState<string | null>(null);
  const [openJobCount, setOpenJobCount] = useState(0);

  // Live counts for launchpad rows
  const [workerStatus, setWorkerStatus] = useState('offline');
  const [pendingBids, setPendingBids] = useState(0);
  const [openApplications, setOpenApplications] = useState(0);

  // ── Fetch all data ─────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Categories (always)
    const { data: catData } = await supabase
      .from('task_categories')
      .select('id, name, price_min, price_max, difficulty_range, sort_order, icon_slug, tier, requires_background_check')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setCategories(catData ?? []);

    // Live job count — open jobs, excluding own posts + blocked users
    if (user) {
      let jobCountQuery = supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .is('worker_id', null)
        .is('deleted_at', null)
        .gte('expires_at', new Date().toISOString())
        .neq('customer_id', user.id);
      if (blockedIds.length > 0) {
        jobCountQuery = jobCountQuery.not('customer_id', 'in', `(${blockedIds.join(',')})`);
      }
      const { count: jc } = await jobCountQuery;
      setOpenJobCount(jc ?? 0);
    } else {
      // Unauthenticated: count all open jobs
      const { count: jc } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open')
        .is('worker_id', null)
        .is('deleted_at', null)
        .gte('expires_at', new Date().toISOString());
      setOpenJobCount(jc ?? 0);
    }

    if (!user) { setLoading(false); return; }

    // Profile data (worker status + first name for greeting)
    const { data: profile } = await supabase
      .from('profiles')
      .select('worker_status, first_name')
      .eq('id', user.id)
      .single();
    setWorkerStatus(profile?.worker_status ?? 'offline');
    setFirstName(profile?.first_name ?? null);

    // Pending bids count (Row 3): total bids on my open posts
    const { data: myOpenJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', user.id)
      .eq('status', 'open')
      .is('deleted_at', null);
    if (myOpenJobs && myOpenJobs.length > 0) {
      const jobIds = myOpenJobs.map(j => j.id);
      const { count } = await supabase
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'pending');
      setPendingBids(count ?? 0);
    } else {
      setPendingBids(0);
    }

    // Open applications count (Row 4): my pending bids
    const { count: appCount } = await supabase
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', user.id)
      .eq('status', 'pending');
    setOpenApplications(appCount ?? 0);

    setLoading(false);
  }, [blockedIds]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── Greeting + date helpers ─────────────────────────────────

  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Morning';
    if (h >= 12 && h < 17) return 'Afternoon';
    return 'Evening';
  })();

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).toUpperCase().replace(/,/g, '');

  // ── Heterogeneous list data ────────────────────────────────

  const listData: ListItem[] = [
    { type: 'masthead' },                          // index 0 — scrolls away
    { type: 'desk' },                              // index 1 — STICKY
    { type: 'categories-label' },                  // index 2 — scrolls under
    ...categories.map((cat, i) => ({
      type: 'category' as const, data: cat, catIndex: i,
    })),
    ...(categories.length > 0
      ? [{ type: 'endcap' as const, count: categories.length }]
      : loading || error
        ? [{ type: 'empty' as const }]
        : []),
  ];

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    switch (item.type) {
      case 'masthead': return '__masthead';
      case 'desk': return '__desk';
      case 'categories-label': return '__label';
      case 'endcap': return '__endcap';
      case 'empty': return '__empty';
      case 'category': return item.data.id.toString();
    }
  }, []);

  // ── Render dispatcher ──────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    switch (item.type) {

      // ── Masthead (scrolls away) ──
      case 'masthead': {
        const isZero = openJobCount === 0;
        return (
          <View style={s.masthead}>
            <View style={s.mastheadTop}>
              <Text style={s.wordmark}>XPROHUB</Text>
              <View style={[s.chip, isZero && s.chipDim]}>
                <View style={[s.chipDotHalo, isZero && s.chipDotHaloDim]}>
                  <View style={[s.chipDot, isZero && s.chipDotDim]} />
                </View>
                {isZero ? (
                  <Text style={s.chipZeroLabel}>NO OPEN JOBS YET</Text>
                ) : (
                  <>
                    <Text style={s.chipCount}>{openJobCount}</Text>
                    <Text style={s.chipLabel}>
                      {openJobCount === 1 ? 'JOB OPEN NOW' : 'JOBS OPEN NOW'}
                    </Text>
                  </>
                )}
              </View>
            </View>
            {firstName ? (
              <Text style={s.greeting}>
                {greeting},{' '}
                <Text style={s.greetingName}>{firstName}.</Text>
              </Text>
            ) : (
              <Text style={s.greeting}>Good {greeting.toLowerCase()}.</Text>
            )}
            <View style={s.dateRow}>
              <View style={s.dateTick} />
              <Text style={s.dateLine}>{'\u00B7'} {dateLabel}</Text>
            </View>

            {/* Ornamental break */}
            <View style={s.ornamentBreak}>
              <View style={s.ornamentLine} />
              <View style={s.ornamentDiamond} />
              <View style={s.ornamentLine} />
            </View>
          </View>
        );
      }

      // ── YOUR DESK (sticky) ──
      case 'desk':
        return (
          <View style={s.deskWrapper}>
            <LaunchpadCard
              router={router}
              trustLevel={trustLevel}
              workerStatus={workerStatus}
              pendingBids={pendingBids}
              openApplications={openApplications}
            />
          </View>
        );

      // ── CATEGORIES label ──
      case 'categories-label':
        return <Text style={s.sectionLabel}>CATEGORIES</Text>;

      // ── Category row ──
      case 'category':
        return (
          <TouchableOpacity
            style={[s.catRow, item.catIndex > 0 && s.catRowDivider]}
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/market?category_id=${item.data.id}`)}
            accessibilityLabel={`${item.data.name}, ${item.data.difficulty_range}, $${item.data.price_min} to $${item.data.price_max}`}
            accessibilityRole="button"
          >
            <Text style={s.catEmoji}>{iconForSlug(item.data.icon_slug)}</Text>
            <View style={s.catTextBlock}>
              <Text style={s.catName} numberOfLines={1}>{item.data.name.toUpperCase()}</Text>
              <Text style={s.catDiff}>{item.data.difficulty_range.toUpperCase()}</Text>
            </View>
            <View style={s.catRightBlock}>
              <Text style={s.catPrice}>${item.data.price_min}{'\u2013'}${item.data.price_max}</Text>
              {item.data.tier === 2 && (
                <View style={s.proBadge}>
                  <Text style={s.proText}>PRO</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );

      // ── End cap ──
      case 'endcap':
        return (
          <View style={s.endCapRow}>
            <View style={s.endCapLine} />
            <Text style={s.endCap}>
              {item.count} CATEGORIES {'\u00B7'} END OF LIST
            </Text>
            <View style={s.endCapLine} />
          </View>
        );

      // ── Empty state (loading / error) ──
      case 'empty':
        if (loading) return <ActivityIndicator color={Colors.gold} style={{ marginTop: 32 }} />;
        if (error) return <Text style={s.errorText}>{error}</Text>;
        return null;
    }
  }, [router, trustLevel, workerStatus, pendingBids, openApplications, openJobCount, firstName, greeting, dateLabel, loading, error]);

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        stickyHeaderIndices={[1]}
        contentContainerStyle={s.listContent}
        style={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1 },
  listContent: { paddingBottom: 160 },

  // Desk wrapper (sticky item — opaque background masks content scrolling under)
  deskWrapper: {
    backgroundColor: Colors.background,
    paddingTop: 4,
    paddingBottom: 14,
  },

  // Masthead
  masthead: {
    paddingTop: 6,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  mastheadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordmark: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: Fonts.heading,
    letterSpacing: 4,
  },

  // Live-count chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.25)',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 6,
  },
  chipDim: {},
  chipDotHalo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 175, 122, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDotHaloDim: {
    backgroundColor: 'transparent',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  chipDotDim: {
    backgroundColor: Colors.textTertiary,
  },
  chipCount: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },
  chipLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  chipZeroLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },

  // Greeting
  greeting: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  greetingName: {
    fontFamily: Fonts.serif,
    color: Colors.gold,
  },

  // Date line
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 6,
  },
  dateTick: {
    width: 4,
    height: 4,
    backgroundColor: Colors.gold,
  },
  dateLine: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },

  // Ornamental break
  ornamentBreak: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
    gap: 10,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.3,
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    backgroundColor: Colors.gold,
    opacity: 0.3,
    transform: [{ rotate: '45deg' }],
  },

  // Launchpad card
  card: {
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  cardLabel: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  rowFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 13,
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 13,
    minHeight: 50,
  },
  glyphFrame: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowLeadGold: {
    fontFamily: Fonts.heading,
    fontSize: 21,
    color: Colors.gold,
  },
  rowLeadSquare: {
    width: 12,
    height: 12,
    backgroundColor: Colors.textSecondary,
  },
  rowLeadAmber: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.amber,
  },
  rowLeadGreen: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.green,
  },
  rowLeadGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMed,
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontFamily: Fonts.body,
    fontSize: 18,
    color: Colors.textTertiary,
  },

  // Publish state signal (Row 2)
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLive: { backgroundColor: Colors.green },
  statusDraft: { backgroundColor: Colors.amber },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  statusLiveText: { color: Colors.green },
  statusDraftText: { color: Colors.amber },

  // Live counts
  countAmber: {
    fontFamily: Fonts.monoMed,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.amber,
  },
  countGreen: {
    fontFamily: Fonts.monoMed,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.green,
  },

  // Section
  sectionLabel: {
    fontFamily: Fonts.display,
    fontSize: 10,
    letterSpacing: 5,
    color: Colors.gold,
    textTransform: 'uppercase',
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 22,
  },

  // Category rows (compact, single-column)
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 22,
    gap: 13,
  },
  catRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  catEmoji: {
    fontSize: 23,
    width: 30,
    textAlign: 'center',
  },
  catTextBlock: {
    flex: 1,
    gap: 3,
  },
  catName: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  catDiff: {
    color: Colors.textSecondary,
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  catRightBlock: {
    alignItems: 'flex-end',
    minWidth: 80,
    gap: 4,
  },
  catPrice: {
    color: Colors.gold,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  proBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 1,
  },
  proText: {
    color: Colors.gold,
    fontFamily: Fonts.displayB,
    fontSize: 8.5,
    letterSpacing: 1.5,
  },

  // End cap
  endCapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 22,
    height: 40,
    gap: 12,
  },
  endCapLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.2,
  },
  endCap: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.textSecondary,
  },

  // Error
  errorText: {
    color: Colors.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
});
