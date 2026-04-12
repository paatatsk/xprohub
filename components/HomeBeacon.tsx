import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GoldenDollar } from './GoldenDollar';

// Persistent one-tap return to home — appears on every screen.
export function HomeBeacon() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.beacon} onPress={() => router.push('/(tabs)')}>
      <GoldenDollar size={24} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  beacon: {
    opacity: 0.4,
    padding: 8,
  },
});
