import { View, Text, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';

// Four-tab navigator: HOME · MARKET · DESK · ACCOUNT
// Per NAVIGATION_IA_PROPOSAL_2026-05-28.md (LOCKED) and NAV_SPEC.md §1.
// Non-primary screens are routable via router.push() but hidden from the
// tab bar (href: null + tabBarStyle hidden).

// ── Tab icon map (swap-ready — Paata supplies finals later) ────────────
const TAB_ICONS: Record<string, string> = {
  index:   '\u2302',   // ⌂ Home
  market:  '\u25C9',   // ◉ Market
  desk:    '\u25A4',   // ▤ Desk
  account: '\u25CB',   // ○ Account
};

// ── Shared header defaults for non-tab screens ─────────────────────────
const headerDefaults = {
  headerStyle:         { backgroundColor: Colors.background },
  headerTintColor:     Colors.gold,
  headerTitleStyle:    { color: Colors.textPrimary, fontWeight: 'bold' as const },
  headerShadowVisible: false,
  headerBackVisible:   false,
};

// ── Shared: hide from tab bar + hide the bar itself on this screen ─────
const hiddenTab = {
  href: null as any,
  tabBarStyle: { display: 'none' as const },
};

function BackButton({ returnTo = '/(tabs)' }: { returnTo?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.canGoBack() ? router.back() : router.push(returnTo as any)}
      style={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 8 }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <View style={{ width: 14, height: 14, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.gold, transform: [{ rotate: '45deg' }] }} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: Fonts.heading,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
      }}
    >
      {/* ── PRIMARY TABS (visible in bar) ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{TAB_ICONS.index}</Text>,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'MARKET',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{TAB_ICONS.market}</Text>,
          ...headerDefaults,
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />
      <Tabs.Screen
        name="desk"
        options={{
          title: 'DESK',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{TAB_ICONS.desk}</Text>,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{TAB_ICONS.account}</Text>,
          ...headerDefaults,
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />

    </Tabs>
  );
}
