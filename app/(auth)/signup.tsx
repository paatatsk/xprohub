import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 3 — Sign Up
// TODO Phase 1: wire to Supabase Auth

export default function SignUpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>CREATE ACCOUNT</Text>
      <Text style={styles.sub}>TODO: Sign Up form → Supabase Auth</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
