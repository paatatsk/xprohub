import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

type HomeBeaconProps = {
  bottom?: number;
  right?: number;
};

export default function HomeBeacon({ bottom = 40, right = 20 }: HomeBeaconProps) {
  const fadeAnim = useRef(new Animated.Value(0.15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Subtle breathing animation — barely visible
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
        toValue: 0.5,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.25,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    // Bloom animation on tap
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.4,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Navigate to hub after bloom
      router.replace('/(tabs)');
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom,
          right,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={1}>
        <Animated.Text style={styles.dollar}>$</Animated.Text>
        {/* Glow ring */}
        <Animated.View style={styles.glowRing} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 40,
    left: 0,
    right: 0,

  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14,14,15,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  dollar: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C9A84C',
    textShadowColor: 'rgba(201,168,76,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  glowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
});