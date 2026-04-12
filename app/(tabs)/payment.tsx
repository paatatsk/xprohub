import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 10 — Payment / Escrow
// Stripe Connect. Funds held until both parties tap Done.
// Auto-releases on job completion.
// TODO Phase 2: Stripe Connect integration

export default function PaymentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>PAYMENT</Text>
      <Text style={styles.sub}>TODO: Stripe Connect escrow</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
