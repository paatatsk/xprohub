import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 7 — Post a Job
// Task Library templates — job posted in 30 seconds.
// Customer taps category → task → adds details → posts.
// TODO Phase 1: save to Supabase jobs table

export default function PostScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>POST A JOB</Text>
      <Text style={styles.sub}>TODO: Task Library → Supabase jobs</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
