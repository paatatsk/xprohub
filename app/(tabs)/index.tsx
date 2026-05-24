// app/(tabs)/index.tsx
// Home — "An honest table of contents."
// Five-voice typography: Space Grotesk / Inter / Playfair / Oswald / IBM Plex Mono

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_500Medium,
} from '@expo-google-fonts/space-grotesk';
import {
  Oswald_600SemiBold,
} from '@expo-google-fonts/oswald';
import {
  IBMPlexMono_400Regular,
} from '@expo-google-fonts/ibm-plex-mono';
import { Colors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── Font constants ───────────────────────────────────────────
const FONT = {
  spaceGrotesk: 'SpaceGrotesk_500Medium',
  oswald:       'Oswald_600SemiBold',
  mono:         'IBMPlexMono_400Regular',
  inter:        'Inter_400Regular',   // loaded globally in _layout.tsx
  interMed:     'Inter_500Medium',    // loaded globally in _layout.tsx
};

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

interface LastReceipt {
  jobId: string;
  otherPartyName: string;
  completedAt: string;    // ISO 8601
  agreedPrice: number;    // dollars, not cents
}

// ── Helpers ──────────────────────────────────────────────────

function iconForSlug(slug: string): string {
  const map: Record<string, string> = {
    'home-cleaning':      '🧹',
    'errands-delivery':   '📦',
    'pet-care':           '🐕',
    'child-care':         '👶',
    'elder-care':         '🧓',
    'moving-labor':       '🚚',
    'tutoring':           '📚',
    'coaching':           '🏆',
    'personal-asst':      '🗂️',
    'vehicle-care':       '🚗',
    'handyman':           '🔨',
    'gardening':          '🌿',
    'trash-recycling':    '♻️',
    'events':             '🎉',
    'electrical':         '⚡',
    'plumbing':           '🔧',
    'painting':           '🎨',
    'carpentry':          '🪚',
    'it-tech':            '💻',
    'hvac':               '❄️',
  };
  return map[slug] ?? '▪';
}

function fmtReceiptDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${day} ${month}`;
}

function fmtPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

// ── YOUR DESK ────────────────────────────────────────────────

function YourDesk({ lastReceipt, router }: {
  lastReceipt: LastReceipt | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={s.desk}>
      <Text style={s.deskLabel}>YOUR DESK</Text>

      {lastReceipt && (
        <TouchableOpacity
          style={s.deskRow}
          onPress={() => router.push(`/job/${lastReceipt.jobId}/receipt` as any)}
          activeOpacity={0.7}
        >
          <Text style={s.deskRowTitle}>Last receipt</Text>
          <Text style={s.deskRowTease}>
            {lastReceipt.otherPartyName.split(' ')[0].toUpperCase()}
            {' \u00B7 '}
            {fmtReceiptDate(lastReceipt.completedAt)}
            {' \u00B7 '}
            {fmtPrice(lastReceipt.agreedPrice)}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={s.deskRow}
        onPress={() => router.push('/(tabs)/my-jobs')}
        activeOpacity={0.7}
      >
        <Text style={s.deskRowTitle}>Jobs I've posted</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.deskRowLast}
        onPress={() => router.push('/(tabs)/my-applications')}
        activeOpacity={0.7}
      >
        <Text style={s.deskRowTitle}>My applications</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<LastReceipt | null>(null);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    Oswald_600SemiBold,
    IBMPlexMono_400Regular,
  });

  // ── Fetch categories ─────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('task_categories')
      .select('id, name, price_min, price_max, difficulty_range, sort_order, icon_slug, tier, requires_background_check')
      .order('sort_order', { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setCategories(data ?? []);
    }
  }, []);

  // ── Fetch last receipt (Row 1) ────────────────────────────
  const fetchLastReceipt = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('jobs')
      .select(`
        id, customer_id, worker_id, completed_at, agreed_price,
        customer:profiles!customer_id(full_name),
        worker:profiles!worker_id(full_name)
      `)
      .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.completed_at && data.agreed_price != null) {
      const isCustomer = user.id === data.customer_id;
      const otherParty = isCustomer
        ? (data.worker as any)?.full_name
        : (data.customer as any)?.full_name;

      setLastReceipt({
        jobId: data.id,
        otherPartyName: otherParty ?? 'Worker',
        completedAt: data.completed_at,
        agreedPrice: Number(data.agreed_price),
      });
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchCategories(), fetchLastReceipt()]).then(() => {
      setLoading(false);
    });
  }, [fetchCategories, fetchLastReceipt]);

  // ── Pull-to-refresh ───────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchLastReceipt()]);
    setRefreshing(false);
  }, [fetchCategories, fetchLastReceipt]);

  // ── Header ────────────────────────────────────────────────
  const renderHeader = useCallback(() => (
    <View style={s.header}>
      <View style={s.wordmarkStrip}>
        <Text style={s.title}>XPROHUB</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/account')}
          activeOpacity={0.7}
          accessibilityLabel="Settings"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={s.gearIcon}>{'\u2699'}</Text>
        </TouchableOpacity>
      </View>

      <YourDesk lastReceipt={lastReceipt} router={router} />

      <Text style={s.sectionLabel}>CATEGORIES</Text>
    </View>
  ), [router, lastReceipt]);

  // ── Empty / loading ───────────────────────────────────────
  const renderEmpty = useCallback(() => {
    if (loading) {
      return <Text style={s.loadingText}>Loading categories...</Text>;
    }
    if (error) {
      return <Text style={s.errorText}>{error}</Text>;
    }
    return null;
  }, [loading, error]);

  // ── Category card ─────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: Category }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/(tabs)/market?category_id=${item.id}`)}
    >
      <View style={s.cardTop}>
        <Text style={s.cardIcon}>{iconForSlug(item.icon_slug)}</Text>
        {item.tier === 2 && (
          <View style={s.tierBadgePro}>
            <Text style={s.tierTextPro}>PRO</Text>
          </View>
        )}
      </View>
      <Text style={s.cardName}>{item.name.toUpperCase()}</Text>
      <Text style={s.cardPrice}>${item.price_min}–${item.price_max}</Text>
      <Text style={s.cardDifficulty}>{item.difficulty_range}</Text>
    </TouchableOpacity>
  ), [router]);

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={s.listContent}
        style={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  list:        { flex: 1 },
  listContent: { paddingBottom: 40, paddingHorizontal: 6 },

  // Header
  header:       { paddingTop: 16, paddingBottom: 16, gap: 12, paddingHorizontal: 6 },
  wordmarkStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 2,
  },
  gearIcon: { fontSize: 22, color: Colors.gold },
  title:    { color: Colors.gold, fontSize: 28, fontFamily: FONT.spaceGrotesk, letterSpacing: 4 },

  // YOUR DESK
  desk: {
    width: '100%', marginTop: 12,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 4,
    backgroundColor: Colors.card,
  },
  deskLabel: {
    fontFamily: FONT.oswald, fontSize: 10, letterSpacing: 4,
    color: Colors.textSecondary, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  deskRow: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  deskRowLast: {
    paddingHorizontal: 16, paddingVertical: 12,
  },
  deskRowTitle: {
    fontFamily: FONT.interMed, fontSize: 14, color: Colors.textPrimary,
  },
  deskRowTease: {
    fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5,
    color: Colors.gold, marginTop: 4, textTransform: 'uppercase',
  },

  // Section
  sectionLabel: {
    fontFamily: FONT.oswald, fontSize: 10, letterSpacing: 4,
    color: Colors.textSecondary, textTransform: 'uppercase',
    marginTop: 20, alignSelf: 'flex-start',
  },

  // Category cards
  card: {
    flex: 1, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 0, padding: 16, margin: 6,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardIcon:  { fontSize: 26 },
  tierBadgePro: {
    backgroundColor: Colors.gold, borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2, justifyContent: 'center',
  },
  tierTextPro: {
    color: Colors.background, fontSize: 9, fontWeight: '800',
  },
  cardName: {
    color: Colors.textPrimary, fontFamily: FONT.interMed,
    fontSize: 13, marginBottom: 6,
  },
  cardPrice: {
    color: Colors.gold, fontFamily: FONT.spaceGrotesk,
    fontSize: 12, marginBottom: 4, fontVariant: ['tabular-nums'],
  },
  cardDifficulty: {
    color: Colors.textSecondary, fontFamily: FONT.inter, fontSize: 11,
  },

  // Loading / error
  loadingText: { color: Colors.gold, fontSize: 14, textAlign: 'center', marginTop: 32 },
  errorText:   { color: Colors.red, fontSize: 13, textAlign: 'center', marginTop: 32, paddingHorizontal: 24 },
});
