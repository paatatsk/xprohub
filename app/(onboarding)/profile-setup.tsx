import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 5 — Profile Setup
// 3 fields only: name, photo (optional), location
// TODO Phase 1: save to Supabase profiles table

export default function ProfileSetupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>YOUR PROFILE</Text>
      <Text style={styles.sub}>TODO: Name + Photo + Location → Supabase</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
