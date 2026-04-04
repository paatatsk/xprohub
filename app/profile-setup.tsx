import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const isReady = name.trim().length > 0 && location.trim().length > 0;

  const handleContinue = () => {
    if (!isReady) return;
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.dollarIcon}>💰</Text>
        </View>

        <Text style={styles.title}>Welcome to XProHub</Text>
        <Text style={styles.subtitle}>Let's get you set up in seconds</Text>

        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

        <TouchableOpacity style={styles.photoBox}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoText}>Add a photo</Text>
          <Text style={styles.photoSub}>Helps people trust you</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="What should we call you?"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Your Location</Text>
        <TextInput
          style={styles.input}
          placeholder="City or neighbourhood"
          placeholderTextColor="#555"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.note}>
          You can find work, post jobs, or do both — you decide when you're ready.
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isReady && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isReady}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Let's Go →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dollarIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2E2E33',
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: 4,
    width: '33%',
    backgroundColor: '#C9A84C',
    borderRadius: 2,
  },
  photoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    borderStyle: 'dashed',
    paddingVertical: 28,
    marginBottom: 28,
  },
  photoIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoSub: {
    fontSize: 13,
    color: '#888',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A84C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  note: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0E0E0F',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
  },
  button: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#2E2E33',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },
});