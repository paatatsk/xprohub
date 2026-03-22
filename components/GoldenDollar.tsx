import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type GoldenDollarProps = {
  size?: 'small' | 'medium' | 'large' | 'hero';
  speed?: 'slow' | 'normal' | 'fast';
  pulse?: boolean;
  glow?: boolean;
};

export default function GoldenDollar({
  size = 'medium',
  speed = 'normal',
  pulse = true,
  glow = true,
}: GoldenDollarProps) {

  const rotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const sizes = {
    small: { container: 40, font: 18, radius: 20 },
    medium: { container: 64, font: 28, radius: 32 },
    large: { container: 96, font: 44, radius: 48 },
    hero: { container: 140, font: 64, radius: 70 },
  };

  const speeds = {
    slow: 4000,
    normal: 2500,
    fast: 1200,
  };

  const s = sizes[size];
  const duration = speeds[speed];

  useEffect(() => {
    // Spinning animation
    Animated.loop(
  Animated.timing(rotation, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    isInteraction: false,
  })
).start();

    // Pulse animation
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glow animation
    if (glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.wrapper, { width: s.container, height: s.container }]}>

      {/* Outer glow ring */}
      {glow && (
        <Animated.View style={[
          styles.glowRing,
          {
            width: s.container + 20,
            height: s.container + 20,
            borderRadius: s.radius + 10,
            opacity: glowAnim,
          }
        ]} />
      )}

      {/* Pulse wrapper */}
      <Animated.View style={[
        styles.pulseWrapper,
        {
          width: s.container,
          height: s.container,
          borderRadius: s.radius,
          transform: [{ scale: pulseAnim }],
        }
      ]}>

        {/* Spinning circle */}
        <Animated.View style={[
          styles.circle,
          {
            width: s.container,
            height: s.container,
            borderRadius: s.radius,
            transform: [{ rotate: spin }],
          }
        ]}>
          {/* Gradient border simulation */}
          <View style={[
            styles.innerCircle,
            {
              width: s.container - 4,
              height: s.container - 4,
              borderRadius: s.radius - 2,
            }
          ]} />
        </Animated.View>

        {/* Dollar sign — stays upright */}
        <View style={[
          styles.dollarContainer,
          {
            width: s.container,
            height: s.container,
            borderRadius: s.radius,
          }
        ]}>
          <Text style={[styles.dollar, { fontSize: s.font }]}>$</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    backgroundColor: '#1A1408',
    position: 'absolute',
  },
  dollarContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollar: {
    color: '#C9A84C',
    fontWeight: '900',
    textShadowColor: 'rgba(201,168,76,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});