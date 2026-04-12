import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/theme';

// Dynamic Job Detail Screen
// Expanded view of a single job card.
// Route: /job/[id] — job UUID passed as param.
// TODO Phase 1: fetch from Supabase jobs table by id

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>JOB DETAIL</Text>
      <Text style={styles.sub}>Job ID: {id}</Text>
      <Text style={styles.sub}>TODO: fetch from Supabase jobs</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
