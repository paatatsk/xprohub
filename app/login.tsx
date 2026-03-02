import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to XProHub</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Continue</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A84C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888890',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },
});
