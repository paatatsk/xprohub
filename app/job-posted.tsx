import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function JobPostedScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Dev Menu Button */}
<TouchableOpacity
  style={{ position: 'absolute', top: 52, left: 20, zIndex: 99, backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1, borderColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
  onPress={() => router.push('/dev-menu')}>
  <Text style={{ color: '#888890', fontSize: 12, fontWeight: '600' }}>🛠️ Dev</Text>
</TouchableOpacity>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Job Posted!</Text>
      <Text style={styles.subtitle}>We're finding the best workers near you right now...</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>👥 Notifying 12 workers nearby</Text>
        <Text style={styles.cardText}>📍 Manhattan, NY</Text>
        <Text style={styles.cardText}>⚡ Average response time: 4 mins</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/worker-match')}>
        <Text style={styles.buttonText}>See Matched Workers 👥</Text>
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
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A84C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888890',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  cardText: {
    fontSize: 15,
    color: '#E8E8EA',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },
});