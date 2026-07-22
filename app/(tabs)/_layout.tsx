import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';

// Four-tab navigator: HOME · MARKET · DESK · ACCOUNT
// Per NAVIGATION_IA_PROPOSAL_2026-05-28.md (LOCKED) and NAV_SPEC.md §1.
// All detail screens live in the root Stack; this layout is tabs only.

// ── Tab icon map (swap-ready — Paata supplies finals later) ────────────
const TAB_ICONS: Record<string, string> = {
  index:   '\u2302',   // ⌂ Home
  market:  '\u25C9',   // ◉ Market
  desk:    '\u25A4',   // ▤ Desk
  account: '\u25CB',   // ○ Account
};

// ── Shared header style for tabs that show a title bar ─────────────────
const tabHeader = {
  headerStyle:         { backgroundColor: Colors.background },
  headerTintColor:     Colors.gold,
  headerTitleStyle:    { color: Colors.textPrimary, fontWeight: 'bold' as const },
  headerShadowVisible: false,
};

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
          fontSize: 10,
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
          ...tabHeader,
          headerShown: true,
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
          ...tabHeader,
          headerShown: true,
        }}
      />

    </Tabs>
  );
}
