import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 13 — Live Market
// TikTok-style full-screen scrolling feed.
// Jobs Feed (workers scroll) + Workers Feed (customers scroll).
// TODO Phase 1: connect to Supabase Realtime jobs table

export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LIVE MARKET</Text>
      <Text style={styles.sub}>TODO: Supabase Realtime feed</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
