import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';
import { playSound } from '../components/SoundManager';

const { width, height } = Dimensions.get('window');

const COIN_COUNT = 18;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

type Coin = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  emoji: string;
};

export default function PaymentSuccessScreen() {
  const [coinsVisible, setCoinsVisible] = useState(false);
  const [amountVisible, setAmountVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const walletScale = useRef(new Animated.Value(0)).current;
  const walletOpacity = useRef(new Animated.Value(0)).current;
  const amountAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const coins = useRef<Coin[]>(
    Array.from({ length: COIN_COUNT }, (_, i) => ({
      id: i,
      x: new Animated.Value(randomBetween(width * 0.1, width * 0.9)),
      y: new Animated.Value(-60),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(randomBetween(0.6, 1.4)),
      emoji: ['🪙', '💛', '🪙', '⭐', '🪙'][i % 5],
    }))
  ).current;

  useEffect(() => {
    // Start the sequence
    setTimeout(() => startCoinSequence(), 400);
  }, []);

  const startCoinSequence = () => {
    setCoinsVisible(true);

    // Play coins sound
    playSound('coins');

    // Animate each coin falling
    const coinAnimations = coins.map((coin, index) => {
      const delay = index * 80;
      const fallDuration = randomBetween(900, 1400);
      const targetY = randomBetween(height * 0.4, height * 0.75);

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(coin.opacity, {
            toValue: 1, duration: 200, useNativeDriver: true,
          }),
          Animated.timing(coin.y, {
            toValue: targetY, duration: fallDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(coin.opacity, {
          toValue: 0, duration: 400, useNativeDriver: true,
        }),
      ]);
    });

    // Run all coins
    Animated.stagger(60, coinAnimations).start();

    // Wallet appears
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(walletScale, {
          toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
        }),
        Animated.timing(walletOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, 600);

    // Amount appears
    setTimeout(() => {
      setAmountVisible(true);
      Animated.spring(amountAnim, {
        toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
      }).start();
      playSound('hiredChord');
    }, 1800);

    // Content appears
    setTimeout(() => {
      setContentVisible(true);
      Animated.timing(contentAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    }, 2600);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Button */}
      <TouchableOpacity
        style={styles.devBtn}
        onPress={() => router.push('/dev-menu')}>
        <Text style={styles.devBtnText}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Falling Coins */}
      {coinsVisible && coins.map(coin => (
        <Animated.Text
          key={coin.id}
          style={[
  styles.coin,
  {
    transform: [
      { translateX: coin.x },
      { translateY: coin.y },
      { scale: coin.scale },
    ],
    opacity: coin.opacity,
  }
]}>
          {coin.emoji}
        </Animated.Text>
      ))}

      {/* Wallet */}
      <Animated.View style={[
        styles.walletContainer,
        {
          transform: [{ scale: walletScale }],
          opacity: walletOpacity,
        }
      ]}>
        <Animated.View style={[
          styles.walletGlow,
          { opacity: glowAnim }
        ]} />
        <Text style={styles.walletEmoji}>👛</Text>
      </Animated.View>

      {/* Amount */}
      {amountVisible && (
        <Animated.View style={[
          styles.amountContainer,
          {
            transform: [{
              scale: amountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }],
            opacity: amountAnim,
          }
        ]}>
          <Text style={styles.amountLabel}>PAYMENT RELEASED</Text>
          <Text style={styles.amountValue}>$82.50</Text>
          <Text style={styles.amountSub}>💚 Sofia has been paid</Text>
        </Animated.View>
      )}

      {/* Content */}
      {contentVisible && (
        <Animated.View style={[styles.content, { opacity: contentAnim }]}>

          <View style={styles.card}>
            <Text style={styles.cardRow}>✅  Job confirmed complete</Text>
            <Text style={styles.cardRow}>💰  Payment released from escrow</Text>
            <Text style={styles.cardRow}>📄  Receipt saved to bookkeeping</Text>
            <Text style={styles.cardRow}>⚡  +50 XP earned for hiring</Text>
          </View>

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push('/review')}
            activeOpacity={0.85}>
            <Text style={styles.reviewButtonText}>⭐ Leave a Review</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}>
            <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>

        </Animated.View>
      )}

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

  devBtn: {
    position: 'absolute', top: 52, left: 20, zIndex: 99,
    backgroundColor: 'rgba(14,14,15,0.8)',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnText: { color: '#888890', fontSize: 12, fontWeight: '600' },

  coin: {
    position: 'absolute',
    fontSize: 28,
    zIndex: 10,
  },

  walletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  walletGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,168,76,0.15)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  walletEmoji: { fontSize: 80, zIndex: 2 },

  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888890',
    letterSpacing: 2,
  },
  amountValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: -2,
    textShadowColor: 'rgba(201,168,76,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  amountSub: {
    fontSize: 16,
    color: '#4CAF7A',
    fontWeight: '700',
  },

  content: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  cardRow: { fontSize: 14, color: '#E8E8EA', fontWeight: '600' },

  reviewButton: {
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
  reviewButtonText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },

  homeButton: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: { color: '#E8E8EA', fontSize: 15, fontWeight: '700' },
});