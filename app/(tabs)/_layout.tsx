import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';

// Four-tab navigator: HOME · MARKET · DESK · ACCOUNT
// Per NAVIGATION_IA_PROPOSAL_2026-05-28.md (LOCKED) and NAV_SPEC.md §1.
// All detail screens live in the root Stack; this layout is tabs only.

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
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'MARKET',
          tabBarIcon: ({ color }) => <Feather name="compass" size={22} color={color} />,
          ...tabHeader,
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="desk"
        options={{
          title: 'DESK',
          tabBarIcon: ({ color }) => <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
          ...tabHeader,
          headerShown: true,
        }}
      />

    </Tabs>
  );
}
