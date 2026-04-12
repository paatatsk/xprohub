import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  size?: number;
}

export function GoldenDollar({ size = 48 }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotateY: rotate }] }}>
      <Text style={[styles.dollar, { fontSize: size }]}>$</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dollar: {
    color: Colors.gold,
    fontWeight: 'bold',
  },
});
