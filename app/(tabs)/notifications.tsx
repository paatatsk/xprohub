import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen — Notifications (Smart Inbox)
// Merged with all alerts. Realtime updates.
// TODO Phase 2: Supabase Realtime notifications table

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>NOTIFICATIONS</Text>
      <Text style={styles.sub}>TODO: Supabase Realtime notifications</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
