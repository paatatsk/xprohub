import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 14 — Belt Progress
// Runs silently in background. Surfaces as badges and toasts.
// Full-screen celebration on promotion + shareable card.
// TODO Phase 3: wire to xp_transactions + belt_history tables

export default function BeltScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BELT SYSTEM</Text>
      <Text style={styles.sub}>TODO: XP + belt progression from Supabase</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
