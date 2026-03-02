import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join XProHub today — it's free</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#444450"
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#444450"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#444450"
          secureTextEntry
        />
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.primaryButtonText}>Create My Account</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Buttons */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>🍎</Text>
          <Text style={styles.socialText}>Apple</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>👤</Text>
          <Text style={styles.socialText}>Face ID</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Already have an account?{' '}
        <Text style={styles.footerLink}
          onPress={() => router.push('/login')}>
          Sign In
        </Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
    padding: 24,
    justifyContent: 'center',
  },

  // Header
  header: {
    marginBottom: 32,
  },
  backButton: {
    color: '#888890',
    fontSize: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A84C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888890',
  },

  // Form
  form: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#E8E8EA',
  },

  // Primary Button
  primaryButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
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
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2E2E33',
  },
  dividerText: {
    color: '#888890',
    fontSize: 13,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  socialText: {
    fontSize: 12,
    color: '#888890',
    fontWeight: '600',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: '#888890',
    fontSize: 14,
  },
  footerLink: {
    color: '#C9A84C',
    fontWeight: '700',
  },
});