import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCREENS = [
  { icon: '✨', name: 'Splash Screen', route: '/splash', color: '#C9A84C' },
  { icon: '👋', name: 'Welcome Screen', route: '/welcome', color: '#C9A84C' },
  { icon: '📝', name: 'Sign Up', route: '/signup', color: '#C9A84C' },
  { icon: '🔑', name: 'Login', route: '/login', color: '#C9A84C' },
  { icon: '👤', name: 'Profile Setup', route: '/profile-setup', color: '#4CAF7A' },
  { icon: '🏠', name: 'Home Screen', route: '/(tabs)', color: '#4CAF7A' },
  { icon: '📋', name: 'Post a Job', route: '/post-job', color: '#4CAF7A' },
  { icon: '🎉', name: 'Job Posted', route: '/job-posted', color: '#4CAF7A' },
  { icon: '🔍', name: 'Worker Match', route: '/worker-match', color: '#9B6EE8' },
  { icon: '👷', name: 'Worker Profile', route: '/worker-profile', color: '#9B6EE8' },
  { icon: '💬', name: 'Chat Screen', route: '/chat', color: '#9B6EE8' },
  { icon: '💳', name: 'Payment Screen', route: '/payment', color: '#5599E0' },
  { icon: '✅', name: 'Payment Success', route: '/payment-success', color: '#5599E0' },
  { icon: '⭐', name: 'Review Screen', route: '/review', color: '#5599E0' },
  { icon: '⚡', name: 'Command Center', route: '/command-center', color: '#C9A84C' },
  { icon: '👤', name: 'My Profile', route: '/my-profile', color: '#C9A84C' },
  { icon: '🔔', name: 'Notifications', route: '/notifications', color: '#5599E0' },
  { icon: '🗺️', name: 'Explore Screen', route: '/explore', color: '#4CAF7A' },
  { icon: '🏆', name: 'XP & Levels', route: '/xp-levels', color: '#C9A84C' },
  { icon: '📊', name: 'Bookkeeping', route: '/bookkeeping', color: '#4CAF7A' },
];

const GROUPS = [
  { label: 'ONBOARDING', color: '#C9A84C', screens: SCREENS.slice(0, 4) },
  { label: 'CUSTOMER FLOW', color: '#4CAF7A', screens: SCREENS.slice(4, 8) },
  { label: 'WORKER MATCH', color: '#9B6EE8', screens: SCREENS.slice(8, 11) },
  { label: 'PAYMENT & REVIEWS', color: '#5599E0', screens: SCREENS.slice(11, 14) },
  { label: 'COMMAND CENTER', color: '#C9A84C', screens: SCREENS.slice(14, 15) },
  { label: 'PROFILE', color: '#C9A84C', screens: SCREENS.slice(15) },
];

export default function DevMenuScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛠️ Dev Menu</Text>
        <Text style={styles.headerSub}>XProHub · {SCREENS.length} screens built</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {GROUPS.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text style={[styles.groupLabel, { color: group.color }]}>{group.label}</Text>
            {group.screens.map((screen) => (
              <TouchableOpacity
                key={screen.route}
                style={styles.screenBtn}
                onPress={() => router.push(screen.route)}>
                <Text style={styles.screenIcon}>{screen.icon}</Text>
                <Text style={styles.screenName}>{screen.name}</Text>
                <View style={[styles.dot, { backgroundColor: screen.color }]} />
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Version */}
        <Text style={styles.version}>XProHub v0.1 · Dev Build</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8E8EA',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#888890',
  },
  group: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  screenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  screenIcon: { fontSize: 20 },
  screenName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8EA',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#444450',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#444450',
    marginTop: 24,
  },
});