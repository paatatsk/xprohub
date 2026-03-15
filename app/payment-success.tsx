import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';

export default function PaymentSuccessScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Dev Menu Button */}
<TouchableOpacity
  style={{ position: 'absolute', top: 52, left: 20, zIndex: 99, backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1, borderColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
  onPress={() => router.push('/dev-menu')}>
  <Text style={{ color: '#888890', fontSize: 12, fontWeight: '600' }}>🛠️ Dev</Text>
</TouchableOpacity>
    <View style={{ marginBottom: 20 }}>
  <GoldenDollar size="large" speed="fast" pulse={true} glow={true} />
</View>
      <Text style={styles.title}>Payment Confirmed!</Text>
      <Text style={styles.subtitle}>Your payment of $82.50 is held securely in escrow</Text>

      <View style={styles.card}>
        <Text style={styles.cardRow}>🛡️  Protected by XProHub Escrow</Text>
        <Text style={styles.cardRow}>📍  Sofia is on her way</Text>
        <Text style={styles.cardRow}>⏰  Arriving at 4:30 PM</Text>
        <Text style={styles.cardRow}>💬  Chat with Sofia anytime</Text>
      </View>

      <Text style={styles.note}>
        Payment will be released to Sofia only after you confirm the job is complete.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/review')}>
        <Text style={styles.buttonText}>Complete & Review Job ⭐</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push('/chat')}>
        <Text style={styles.chatButtonText}>💬 Message Sofia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76,175,122,0.15)',
    borderWidth: 2,
    borderColor: '#4CAF7A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF7A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  icon: { fontSize: 36, color: '#4CAF7A', fontWeight: '800' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8E8EA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888890',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  cardRow: { fontSize: 14, color: '#E8E8EA', fontWeight: '600' },
  note: {
    fontSize: 12,
    color: '#444450',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  chatButton: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: { color: '#E8E8EA', fontSize: 15, fontWeight: '700' },
});