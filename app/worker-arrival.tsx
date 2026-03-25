import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated, StyleSheet, Text,
    TouchableOpacity, View
} from 'react-native';

const MOCK_WORKER = {
  name: 'Sofia Rodriguez',
  avatar: 'S',
  belt: '🟡 Yellow Belt',
  rating: 4.97,
  jobsCompleted: 48,
  category: 'Deep Cleaning',
  verified: true,
  bestWorkPhoto: '✨',
  distanceKm: 2.4,
  etaMinutes: 12,
};

const MOCK_JOB = {
  title: 'Deep Cleaning',
  icon: '🏠',
  address: '123 Park Ave, Manhattan',
  startTime: '10:00 AM',
  agreedRate: '$35/hr',
  estimatedTotal: '$105.00',
};

export default function WorkerArrivalScreen() {
  const [etaMinutes, setEtaMinutes] = useState(MOCK_WORKER.etaMinutes);
  const [distanceKm, setDistanceKm] = useState(MOCK_WORKER.distanceKm);
  const [workerArrived, setWorkerArrived] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const arrivedAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    // Pulse the ETA card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Moving dot animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Simulate worker getting closer
    const interval = setInterval(() => {
      setEtaMinutes(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setWorkerArrived(true);
          Animated.spring(arrivedAnim, {
            toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
          }).start();
          return 0;
        }
        return prev - 1;
      });
      setDistanceKm(prev => Math.max(0, parseFloat((prev - 0.2).toFixed(1))));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker En Route</Text>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.liveDot, { opacity: glowAnim }]} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Arrived Banner */}
        {workerArrived && (
          <Animated.View style={[
            styles.arrivedBanner,
            {
              transform: [{ scale: arrivedAnim.interpolate({ inputRange: [0,1], outputRange: [0.9,1] }) }],
              opacity: arrivedAnim,
            }
          ]}>
            <Text style={styles.arrivedIcon}>🎉</Text>
            <View style={styles.arrivedInfo}>
              <Text style={styles.arrivedTitle}>Sofia has arrived!</Text>
              <Text style={styles.arrivedSub}>Your worker is at the door</Text>
            </View>
          </Animated.View>
        )}

        {/* ETA Card */}
        {!workerArrived && (
          <Animated.View style={[
            styles.etaCard,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <View style={styles.etaMain}>
              <Text style={styles.etaTime}>{etaMinutes}</Text>
              <Text style={styles.etaUnit}>min away</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaDistance}>
              <Text style={styles.etaDistanceValue}>{distanceKm} km</Text>
              <Text style={styles.etaDistanceLabel}>distance</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaStatus}>
              <Animated.View style={[
                styles.etaStatusDot,
                { opacity: glowAnim }
              ]} />
              <Text style={styles.etaStatusText}>On the way</Text>
            </View>
          </Animated.View>
        )}

        {/* Route Visualizer */}
        {!workerArrived && (
          <View style={styles.routeCard}>
            <Text style={styles.routeLabel}>ROUTE</Text>
            <View style={styles.routeTrack}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#4CAF7A' }]} />
                <Text style={styles.routePointText}>Sofia</Text>
              </View>
              <View style={styles.routeLine}>
                <Animated.View style={[
  styles.routeMovingDot,
  {
    transform: [{
      translateX: dotAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 160],
      }),
    }],
  }
]} />
              </View>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#C9A84C' }]} />
                <Text style={styles.routePointText}>You</Text>
              </View>
            </View>
          </View>
        )}

        {/* Worker Card */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>YOUR WORKER</Text>
        </View>
        <View style={styles.workerCard}>
          <View style={styles.workerTop}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>{MOCK_WORKER.avatar}</Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{MOCK_WORKER.name}</Text>
              <Text style={styles.workerMeta}>
                {MOCK_WORKER.belt} · ★ {MOCK_WORKER.rating}
              </Text>
              <Text style={styles.workerJobs}>
                {MOCK_WORKER.jobsCompleted} jobs completed
              </Text>
            </View>
            <View style={styles.workerBadges}>
              {MOCK_WORKER.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✅</Text>
                </View>
              )}
            </View>
          </View>

          {/* Best Work Photo */}
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>BEST WORK IN {MOCK_WORKER.category.toUpperCase()}</Text>
            <View style={styles.portfolioPhoto}>
              <Text style={styles.portfolioEmoji}>{MOCK_WORKER.bestWorkPhoto}</Text>
              <Text style={styles.portfolioPhotoText}>Deep Cleaning · 5 stars</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.workerStats}>
            <View style={styles.workerStat}>
              <Text style={styles.workerStatValue}>4.97</Text>
              <Text style={styles.workerStatLabel}>Rating</Text>
            </View>
            <View style={styles.workerStatDivider} />
            <View style={styles.workerStat}>
              <Text style={styles.workerStatValue}>48</Text>
              <Text style={styles.workerStatLabel}>Jobs</Text>
            </View>
            <View style={styles.workerStatDivider} />
            <View style={styles.workerStat}>
              <Text style={styles.workerStatValue}>100%</Text>
              <Text style={styles.workerStatLabel}>On Time</Text>
            </View>
            <View style={styles.workerStatDivider} />
            <View style={styles.workerStat}>
              <Text style={styles.workerStatValue}>🟡</Text>
              <Text style={styles.workerStatLabel}>Belt</Text>
            </View>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>JOB DETAILS</Text>
        </View>
        <View style={styles.jobCard}>
          <View style={styles.jobRow}>
            <Text style={styles.jobIcon}>{MOCK_JOB.icon}</Text>
            <Text style={styles.jobTitle}>{MOCK_JOB.title}</Text>
            <Text style={styles.jobRate}>{MOCK_JOB.agreedRate}</Text>
          </View>
          <View style={styles.jobDivider} />
          <View style={styles.jobDetails}>
            <Text style={styles.jobDetail}>📍 {MOCK_JOB.address}</Text>
            <Text style={styles.jobDetail}>⏰ {MOCK_JOB.startTime}</Text>
            <Text style={styles.jobDetail}>💰 Est. {MOCK_JOB.estimatedTotal}</Text>
            <Text style={styles.jobDetail}>🛡️ Payment held in escrow</Text>
          </View>
        </View>

        {/* Safety Card */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>🔒 Your safety is protected</Text>
          <Text style={styles.safetyText}>
            Sofia's identity has been verified. All communication is logged. Emergency SOS available at any time.
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => router.push('/chat')}
          activeOpacity={0.85}>
          <Text style={styles.messageBtnText}>💬 Message Sofia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sosBtn}
          activeOpacity={0.85}>
          <Text style={styles.sosBtnText}>🚨 Emergency SOS</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12,
  },
  backBtn: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#E8E8EA' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E05252' },
  liveBadgeText: { fontSize: 11, color: '#E05252', fontWeight: '800', letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  arrivedBanner: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(76,175,122,0.4)',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#4CAF7A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  arrivedIcon: { fontSize: 36 },
  arrivedInfo: { flex: 1 },
  arrivedTitle: { fontSize: 18, fontWeight: '800', color: '#4CAF7A' },
  arrivedSub: { fontSize: 13, color: '#888890', marginTop: 2 },

  etaCard: {
    backgroundColor: '#171719', borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 4,
  },
  etaMain: { flex: 1, alignItems: 'center' },
  etaTime: { fontSize: 52, fontWeight: '800', color: '#C9A84C', lineHeight: 56 },
  etaUnit: { fontSize: 13, color: '#888890', fontWeight: '600' },
  etaDivider: { width: 1, height: 50, backgroundColor: '#2E2E33' },
  etaDistance: { flex: 1, alignItems: 'center' },
  etaDistanceValue: { fontSize: 24, fontWeight: '800', color: '#E8E8EA' },
  etaDistanceLabel: { fontSize: 12, color: '#888890' },
  etaStatus: { flex: 1, alignItems: 'center', gap: 6 },
  etaStatusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF7A' },
  etaStatusText: { fontSize: 12, color: '#4CAF7A', fontWeight: '700' },

  routeCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  routeLabel: {
    fontSize: 10, fontWeight: '700', color: '#888890', letterSpacing: 1.5,
  },
  routeTrack: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  routePoint: { alignItems: 'center', gap: 4 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routePointText: { fontSize: 10, color: '#888890', fontWeight: '600' },
  routeLine: {
    flex: 1, height: 3, backgroundColor: '#2E2E33',
    borderRadius: 2, position: 'relative', overflow: 'hidden',
  },
  routeMovingDot: {
  position: 'absolute', top: -4,
  width: 11, height: 11, borderRadius: 6,
  backgroundColor: '#C9A84C',
  shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
},

  sectionLabel: { marginTop: 4 },
  sectionLabelText: {
    fontSize: 10, fontWeight: '700', color: '#888890', letterSpacing: 1.5,
  },

  workerCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 24, padding: 16, gap: 14,
  },
  workerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  workerAvatar: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  workerAvatarText: { fontSize: 24, fontWeight: '800', color: '#0E0E0F' },
  workerInfo: { flex: 1, gap: 4 },
  workerName: { fontSize: 17, fontWeight: '800', color: '#E8E8EA' },
  workerMeta: { fontSize: 12, color: '#888890' },
  workerJobs: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },
  workerBadges: { gap: 6 },
  verifiedBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1, borderColor: 'rgba(76,175,122,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 16 },

  portfolioCard: {
    backgroundColor: '#0E0E0F', borderRadius: 16, padding: 14, gap: 10,
  },
  portfolioLabel: {
    fontSize: 9, fontWeight: '700', color: '#888890', letterSpacing: 1.5,
  },
  portfolioPhoto: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  portfolioEmoji: { fontSize: 32 },
  portfolioPhotoText: { fontSize: 13, color: '#888890', fontWeight: '600' },

  workerStats: {
    flexDirection: 'row', backgroundColor: '#0E0E0F',
    borderRadius: 16, paddingVertical: 14,
  },
  workerStat: { flex: 1, alignItems: 'center', gap: 4 },
  workerStatValue: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  workerStatLabel: { fontSize: 9, color: '#888890', fontWeight: '600' },
  workerStatDivider: { width: 1, backgroundColor: '#2E2E33' },

  jobCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobIcon: { fontSize: 24 },
  jobTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  jobRate: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  jobDivider: { height: 1, backgroundColor: '#2E2E33' },
  jobDetails: { gap: 8 },
  jobDetail: { fontSize: 13, color: '#888890', fontWeight: '600' },

  safetyCard: {
    backgroundColor: 'rgba(74,158,219,0.06)',
    borderWidth: 1, borderColor: 'rgba(74,158,219,0.2)',
    borderRadius: 16, padding: 14, gap: 6,
  },
  safetyTitle: { fontSize: 13, fontWeight: '800', color: '#4A9EDB' },
  safetyText: { fontSize: 12, color: '#888890', lineHeight: 18 },

  messageBtn: {
    backgroundColor: '#C9A84C', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  messageBtnText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },

  sosBtn: {
    backgroundColor: '#171719', borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.3)',
    borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  sosBtnText: { fontSize: 14, color: '#E05252', fontWeight: '700' },
});