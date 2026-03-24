import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';
import { playSound } from '../components/SoundManager';

const { width, height } = Dimensions.get('window');

const JOB = {
  title: 'Deep Cleaning',
  icon: '🏠',
  customerName: 'Marcus Johnson',
  customerAvatar: 'M',
  customerRating: 4.9,
  workerName: 'Sofia Rodriguez',
  workerAvatar: 'S',
  workerBelt: '🟡 Yellow Belt',
  workerRating: 4.97,
  agreedRate: '$35/hr',
  estimatedDuration: '3 hours',
  estimatedTotal: '$105.00',
  address: '123 Park Ave, Manhattan',
  startTime: 'Tomorrow at 10:00 AM',
};

export default function JobAgreementScreen() {
  const [phase, setPhase] = useState<'loading' | 'ceremony' | 'hired' | 'details'>('loading');

  // Animations
  const bgGlow = useRef(new Animated.Value(0)).current;
  const handshakeScale = useRef(new Animated.Value(0)).current;
  const handshakeOpacity = useRef(new Animated.Value(0)).current;
  const chordGlow = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const workerAnim = useRef(new Animated.Value(0)).current;
  const customerAnim = useRef(new Animated.Value(0)).current;
  const detailsAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    setTimeout(() => startCeremony(), 500);
  }, []);

  const startCeremony = () => {
    setPhase('ceremony');

    // Play hired chord sound
    playSound('hiredChord');

    // Background glow
    Animated.timing(bgGlow, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    // Handshake appears
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(handshakeScale, {
          toValue: 1, friction: 4, tension: 40, useNativeDriver: true,
        }),
        Animated.timing(handshakeOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse the handshake
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }, 800);

    // Chord glow
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(chordGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Particles burst
    setTimeout(() => {
      particleAnims.forEach((p, i) => {
        const angle = (i / particleAnims.length) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.translateX, {
            toValue: Math.cos(angle) * distance, duration: 800, useNativeDriver: true,
          }),
          Animated.timing(p.translateY, {
            toValue: Math.sin(angle) * distance, duration: 800, useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
        });
      });
    }, 600);

    // Title appears
    setTimeout(() => {
      setPhase('hired');
      Animated.spring(titleAnim, {
        toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
      }).start();
    }, 1200);

    // Worker and customer cards appear
    setTimeout(() => {
      Animated.stagger(200, [
        Animated.spring(workerAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(customerAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
    }, 1800);

    // Details appear
    setTimeout(() => {
      setPhase('details');
      Animated.timing(detailsAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    }, 2600);
  };

  const PARTICLE_EMOJIS = ['✨', '⭐', '💛', '🌟', '✨', '💫', '⭐', '🌟'];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Button */}
      <TouchableOpacity style={styles.devBtn} onPress={() => router.push('/dev-menu')}>
        <Text style={styles.devBtnText}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { opacity: bgGlow }]} />

      {/* Ceremony Center */}
      <View style={styles.ceremonyCenter}>

        {/* Chord glow ring */}
        <Animated.View style={[styles.chordRing, { opacity: chordGlow }]} />

        {/* Particles */}
        {particleAnims.map((p, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              {
                opacity: p.opacity,
                transform: [
                  { translateX: p.translateX },
                  { translateY: p.translateY },
                ],
              }
            ]}>
            {PARTICLE_EMOJIS[i]}
          </Animated.Text>
        ))}

        {/* Handshake */}
        <Animated.View style={[
          styles.handshakeContainer,
          {
            transform: [
              { scale: Animated.multiply(handshakeScale, pulseAnim) },
            ],
            opacity: handshakeOpacity,
          }
        ]}>
          <Text style={styles.handshakeEmoji}>🤝</Text>
        </Animated.View>

      </View>

      {/* Hired Title */}
      {phase !== 'loading' && (
        <Animated.View style={[
          styles.titleContainer,
          {
            transform: [{
              scale: titleAnim.interpolate({
                inputRange: [0, 1], outputRange: [0.5, 1],
              }),
            }],
            opacity: titleAnim,
          }
        ]}>
          <Text style={styles.hiredTitle}>You're Hired! 🎉</Text>
          <Text style={styles.hiredSub}>{JOB.icon} {JOB.title}</Text>
        </Animated.View>
      )}

      {/* Worker + Customer Cards */}
      <View style={styles.cardsRow}>
        <Animated.View style={[
          styles.personCard,
          {
            transform: [{ scale: workerAnim }],
            opacity: workerAnim,
          }
        ]}>
          <View style={[styles.avatar, { backgroundColor: '#C9A84C' }]}>
            <Text style={styles.avatarText}>{JOB.workerAvatar}</Text>
          </View>
          <Text style={styles.personName}>{JOB.workerName.split(' ')[0]}</Text>
          <Text style={styles.personRole}>Worker</Text>
          <Text style={styles.personMeta}>{JOB.workerBelt}</Text>
          <Text style={styles.personRating}>★ {JOB.workerRating}</Text>
        </Animated.View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>🤝</Text>
        </View>

        <Animated.View style={[
          styles.personCard,
          {
            transform: [{ scale: customerAnim }],
            opacity: customerAnim,
          }
        ]}>
          <View style={[styles.avatar, { backgroundColor: '#4A9EDB' }]}>
            <Text style={styles.avatarText}>{JOB.customerAvatar}</Text>
          </View>
          <Text style={styles.personName}>{JOB.customerName.split(' ')[0]}</Text>
          <Text style={styles.personRole}>Customer</Text>
          <Text style={styles.personMeta}>Verified ✅</Text>
          <Text style={styles.personRating}>★ {JOB.customerRating}</Text>
        </Animated.View>
      </View>

      {/* Job Details */}
      {phase === 'details' && (
        <Animated.View style={[styles.detailsCard, { opacity: detailsAnim }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{JOB.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>{JOB.startTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={styles.detailText}>
              {JOB.agreedRate} · {JOB.estimatedDuration} · Est. {JOB.estimatedTotal}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🛡️</Text>
            <Text style={styles.detailText}>Payment held in escrow until job complete</Text>
          </View>
        </Animated.View>
      )}

      {/* Action Buttons */}
      {phase === 'details' && (
        <Animated.View style={[styles.buttonsContainer, { opacity: detailsAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/active-job')}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>📍 Navigate to Job</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/chat')}
            activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>💬 Message {JOB.customerName.split(' ')[0]}</Text>
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
    paddingHorizontal: 20,
  },

  devBtn: {
    position: 'absolute', top: 52, left: 20, zIndex: 99,
    backgroundColor: 'rgba(14,14,15,0.8)',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnText: { color: '#888890', fontSize: 12, fontWeight: '600' },

  bgGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(201,168,76,0.04)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 80,
    elevation: 0,
  },

  ceremonyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    width: 160,
    height: 160,
  },

  chordRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.4)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 8,
  },

  particle: {
    position: 'absolute',
    fontSize: 20,
    zIndex: 10,
  },

  handshakeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  handshakeEmoji: { fontSize: 48 },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  hiredTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E8E8EA',
    textAlign: 'center',
  },
  hiredSub: {
    fontSize: 16,
    color: '#C9A84C',
    fontWeight: '700',
  },

  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  personCard: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#0E0E0F' },
  personName: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  personRole: { fontSize: 11, color: '#888890' },
  personMeta: { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  personRating: { fontSize: 12, color: '#888890' },

  vsContainer: { alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 24 },

  detailsCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIcon: { fontSize: 16 },
  detailText: { fontSize: 13, color: '#E8E8EA', flex: 1, lineHeight: 18 },
  detailDivider: { height: 1, backgroundColor: '#2E2E33' },

  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#E8E8EA', fontSize: 15, fontWeight: '700' },
});