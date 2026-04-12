import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 12 — Earnings Summary
// Auto-generated, no manual input required.
// Shows both earnings (worker) and spending (customer) in one wallet.
// TODO Phase 2: pull from Supabase payments table

export default function EarningsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>EARNINGS</Text>
      <Text style={styles.sub}>TODO: Auto-generated from Supabase payments</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
