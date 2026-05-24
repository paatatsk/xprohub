import React, { useCallback, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface Props {
  size?: number;
  spinning?: boolean;
}

export function GoldenDollar({ size = 48, spinning = false }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const startSpin = useCallback(() => {
    spin.setValue(0);
    animRef.current = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    animRef.current.start();
  }, [spin]);

  const stopSpin = useCallback(() => {
    animRef.current?.stop();
    spin.setValue(0);
  }, [spin]);

  React.useEffect(() => {
    if (spinning) {
      startSpin();
    } else {
      stopSpin();
    }
    return () => stopSpin();
  }, [spinning, startSpin, stopSpin]);

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
