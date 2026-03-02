import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top glow */}
      <View style={styles.topGlow} />

      {/* Logo */}
      <View style={styles.logoSection}>
        <Text style={styles.logo}>XProHub</Text>
        <View style={styles.logoLine} />
        <Text style={styles.logoSub}>Your community. Your income. Your way.</Text>
      </View>

      {/* Feature cards */}
      <View style={styles.cardsSection}>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>💼</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Find Work Instantly</Text>
            <Text style={styles.cardDesc}>Browse jobs near you and start earning today — no degree required</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>📍</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Hire People You Trust</Text>
            <Text style={styles.cardDesc}>Find verified workers nearby for any task — big or small</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>🛡️</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Always Protected</Text>
            <Text style={styles.cardDesc}>Every job covered by XProHub Protection — secure payments, guaranteed</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>⚡</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Grow & Level Up</Text>
            <Text style={styles.cardDesc}>Earn XP, unlock badges and build your reputation with every job</Text>
          </View>
        </View>

      </View>

      {/* Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/signup')}>
          <Text style={styles.primaryButtonText}>Get Started — It's Free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/login')}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  // Glow
  topGlow: {
    position: 'absolute',
    top: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 100,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 2,
  },
  logoLine: {
    width: 50,
    height: 3,
    backgroundColor: '#C9A84C',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 10,
    opacity: 0.6,
  },
  logoSub: {
    fontSize: 13,
    color: '#888890',
    fontStyle: 'italic',
  },

  // Cards
  cardsSection: {
    width: '100%',
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    gap: 14,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8E8EA',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: '#888890',
    lineHeight: 17,
  },

  // Buttons
  buttonSection: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  secondaryButtonText: {
    color: '#888890',
    fontSize: 14,
    fontWeight: '600',
  },
});