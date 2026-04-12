import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { Button } from '../../components/Button';
import { GoldenDollar } from '../../components/GoldenDollar';

// Screen 2 — Welcome
// Tagline, feature cards, Get Started CTA

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <GoldenDollar size={64} />
      <Text style={styles.title}>XPROHUB</Text>
      <Text style={styles.tagline}>Real Work. Fair Pay. For Everyone.</Text>
      <View style={styles.spacer} />
      <Button label="GET STARTED" onPress={() => router.push('/(auth)/signup')} />
      <Button label="SIGN IN" variant="ghost" onPress={() => router.push('/(auth)/login')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title:     { color: Colors.gold, fontSize: 36, fontWeight: 'bold', letterSpacing: 4 },
  tagline:   { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  spacer:    { flex: 1 },
});
