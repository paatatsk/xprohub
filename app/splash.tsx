import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: glow appears, logo fades in and scales up, tagline appears, then navigate
    Animated.sequence([
      // Glow appears first
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Logo fades in and scales up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1200),
    ]).start(() => {
      // Navigate to welcome screen
      router.replace('/welcome');
    });
  }, []);

  return (
    <View style={styles.container}>

      {/* Background glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, {
        opacity: logoOpacity,
        transform: [{ scale: logoScale }]
      }]}>
        <Text style={styles.logo}>XProHub</Text>
        <View style={styles.logoUnderline} />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Built with purpose. Designed for people.
      </Animated.Text>

      {/* Bottom badge */}
      <Animated.Text style={[styles.badge, { opacity: taglineOpacity }]}>
        ✦ Your community. Your income. Your way.
      </Animated.Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 80,
    elevation: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 2,
  },
  logoUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#C9A84C',
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.6,
  },
  tagline: {
    fontSize: 15,
    color: '#888890',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    bottom: 60,
    fontSize: 12,
    color: '#444450',
    letterSpacing: 1,
  },
});