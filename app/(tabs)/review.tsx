import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 11 — Rate / Review
// Both directions: customer reviews worker, worker reviews customer.
// XP awarded on submission.
// TODO Phase 2: write to Supabase reviews + xp_transactions tables

export default function ReviewScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LEAVE A REVIEW</Text>
      <Text style={styles.sub}>TODO: Supabase reviews + XP trigger</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
