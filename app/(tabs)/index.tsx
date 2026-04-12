import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { GoldenDollar } from '../../components/GoldenDollar';

// Screen 6 — Home (Role-Adaptive)
// Morphs between Worker mode and Customer mode with one toggle.
// Hub & Spoke accessible via "Explore All Features" button.
// TODO Phase 1: read role from Supabase session

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <GoldenDollar size={64} />
      <Text style={styles.title}>XPROHUB</Text>
      <Text style={styles.tagline}>Real Work. Fair Pay. For Everyone.</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/post')}>
          <Text style={styles.btnText}>GET HELP</Text>
          <Text style={styles.btnSub}>Post a job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnWorker]} onPress={() => router.push('/(tabs)/market')}>
          <Text style={styles.btnText}>START EARNING</Text>
          <Text style={styles.btnSub}>Browse jobs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title:     { color: Colors.gold, fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  tagline:   { color: Colors.textSecondary, fontSize: 13 },
  actions:   { flexDirection: 'row', gap: 12, marginTop: 32 },
  btn:       { flex: 1, backgroundColor: Colors.gold, borderRadius: 12, padding: 20, alignItems: 'center' },
  btnWorker: { backgroundColor: Colors.green },
  btnText:   { color: Colors.background, fontWeight: '800', fontSize: 13 },
  btnSub:    { color: Colors.background, fontSize: 11, marginTop: 4, opacity: 0.7 },
});
