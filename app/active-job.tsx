import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { playSound } from '../components/SoundManager';

const MOCK_JOB = {
  id: 'XPH-2026-04821',
  title: 'Deep Cleaning',
  icon: '🏠',
  customerName: 'Marcus Johnson',
  customerRating: 4.9,
  address: '123 Park Ave, Manhattan',
  rate: 35,
  rateType: 'hr',
  startTime: '10:00 AM',
  estimatedHours: 3,
};

type JobPhase = 'enroute' | 'working' | 'proof';

const MOCK_PHOTOS = ['🛁', '🪴', '✨', '🪟', '🛋️'];

export default function ActiveJobScreen() {
  const [phase, setPhase] = useState<JobPhase>('enroute');
  const [atLocation, setAtLocation] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockInTime, setClockInTime] = useState('');
  const [photos, setPhotos] = useState(['🛁', '🪴', '✨']);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('after');
  const [submitting, setSubmitting] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const proofAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Simulate GPS
  useEffect(() => {
    const gpsTimer = setTimeout(() => setAtLocation(true), 3000);
    return () => clearTimeout(gpsTimer);
  }, []);

  // Pulse clock in button
  useEffect(() => {
    if (!atLocation || phase !== 'enroute') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [atLocation, phase]);

  // Fade in working state
  useEffect(() => {
    if (phase === 'working') {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(statusAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
    }
    if (phase === 'proof') {
      Animated.timing(proofAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase === 'working') {
      timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleClockIn = () => {
    if (!atLocation) return;
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    setClockInTime(`${h % 12 || 12}:${m} ${ampm}`);
    playSound('clockIn');
    setPhase('working');
  };

  const handleClockOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('proof');
  };

  const handleAddPhoto = () => {
    if (photos.length >= 5) return;
    const next = MOCK_PHOTOS[photos.length % MOCK_PHOTOS.length];
    setPhotos(prev => [...prev, next]);
  };

  const handleSubmitProof = () => {
    setSubmitting(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.push('/job-confirm'), 600);
    });
  };

  const formatTime = (secs: number) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const currentEarnings = ((elapsedSeconds / 3600) * MOCK_JOB.rate).toFixed(2);

  const getStatusColor = () => {
    if (phase === 'working') return '#4CAF7A';
    if (phase === 'proof') return '#9B6EE8';
    if (atLocation) return '#C9A84C';
    return '#888890';
  };

  const getStatusLabel = () => {
    if (phase === 'working') return 'IN PROGRESS';
    if (phase === 'proof') return 'SUBMITTING PROOF';
    if (atLocation) return 'AT LOCATION';
    return 'EN ROUTE';
  };

  const getPhaseTitle = () => {
    if (phase === 'proof') return 'Job Complete';
    return 'Active Job';
  };

  const getStepBadge = () => {
    if (phase === 'proof') return 'Step 1 of 3';
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getPhaseTitle()}</Text>
        {getStepBadge() ? (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{getStepBadge()}</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Job Banner — always visible */}
        <View style={styles.jobBanner}>
          <View style={styles.jobBannerRow}>
            <Text style={styles.jobIcon}>{MOCK_JOB.icon}</Text>
            <View style={styles.jobBannerInfo}>
              <Text style={styles.jobTitle}>{MOCK_JOB.title}</Text>
              <Text style={styles.jobCustomer}>
                {MOCK_JOB.customerName} · ★ {MOCK_JOB.customerRating}
              </Text>
            </View>
            <View style={styles.jobRate}>
              <Text style={styles.jobRateAmount}>${MOCK_JOB.rate}</Text>
              <Text style={styles.jobRateType}>/{MOCK_JOB.rateType}</Text>
            </View>
          </View>
          <View style={styles.jobBannerDivider} />
          <View style={styles.jobTagRow}>
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>📍 {MOCK_JOB.address}</Text>
            </View>
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>⏰ Start {MOCK_JOB.startTime}</Text>
            </View>
          </View>
        </View>

        {/* ── PHASE 1: EN ROUTE ── */}
        {phase === 'enroute' && (
          <>
            <View style={[
              styles.gpsCard,
              atLocation
                ? { borderColor: 'rgba(76,175,122,0.4)', backgroundColor: 'rgba(76,175,122,0.06)' }
                : { borderColor: 'rgba(201,168,76,0.2)', backgroundColor: 'rgba(201,168,76,0.04)' }
            ]}>
              <Text style={styles.gpsIcon}>{atLocation ? '✅' : '📡'}</Text>
              <Text style={[styles.gpsText, { color: atLocation ? '#4CAF7A' : '#C9A84C' }]}>
                {atLocation
                  ? 'You are at the job location — ready to clock in'
                  : 'Checking your location...'}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnBlue]} onPress={() => {}}>
                <Text style={styles.actionBtnIcon}>🗺️</Text>
                <Text style={[styles.actionBtnText, { color: '#5599E0' }]}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/chat')}>
                <Text style={styles.actionBtnIcon}>💬</Text>
                <Text style={styles.actionBtnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                <Text style={styles.actionBtnIcon}>📸</Text>
                <Text style={styles.actionBtnText}>Before Photo</Text>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: atLocation ? pulseAnim : 1 }] }}>
              <TouchableOpacity
                style={[styles.clockInBtn, !atLocation && styles.clockInBtnDisabled]}
                onPress={handleClockIn}
                disabled={!atLocation}
                activeOpacity={0.85}>
                <Text style={styles.clockInBtnIcon}>⏰</Text>
                <Text style={[styles.clockInBtnText, !atLocation && { color: '#555558' }]}>
                  Clock In
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {!atLocation && (
              <Text style={styles.gpsHint}>Move within 500m of the job address to enable Clock In</Text>
            )}
          </>
        )}

        {/* ── PHASE 2: WORKING ── */}
        {phase === 'working' && (
          <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>

            <Animated.View style={[styles.timerCard, {
              transform: [{ scale: statusAnim.interpolate({ inputRange: [0,1], outputRange: [0.9,1] }) }],
            }]}>
              <Text style={styles.timerLabel}>TIME ELAPSED</Text>
              <Text style={styles.timerDigits}>{formatTime(elapsedSeconds)}</Text>
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>
                  📍 Verified at {MOCK_JOB.address} · {clockInTime}
                </Text>
              </View>
            </Animated.View>

            <View style={styles.earningsRow}>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Current Earnings</Text>
                <Text style={styles.earningsAmount}>${currentEarnings}</Text>
              </View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Est. Total</Text>
                <Text style={[styles.earningsAmount, { color: '#888890' }]}>
                  ${(MOCK_JOB.rate * MOCK_JOB.estimatedHours).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/chat')}>
                <Text style={styles.actionBtnIcon}>💬</Text>
                <Text style={styles.actionBtnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                <Text style={styles.actionBtnIcon}>📸</Text>
                <Text style={styles.actionBtnText}>Progress Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.clockOutBtn}
              onPress={handleClockOut}
              activeOpacity={0.85}>
              <Text style={styles.clockOutBtnIcon}>⏹</Text>
              <Text style={styles.clockOutBtnText}>Clock Out & Submit Proof</Text>
            </TouchableOpacity>

          </Animated.View>
        )}

        {/* ── PHASE 3: PROOF ── */}
        {phase === 'proof' && (
          <Animated.View style={{ opacity: proofAnim, gap: 12 }}>

            {/* Instruction Card */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>📸</Text>
              <View style={styles.instructionText}>
                <Text style={styles.instructionTitle}>Add proof photos</Text>
                <Text style={styles.instructionSub}>
                  Show the completed work. Photos are sent to {MOCK_JOB.customerName}.
                </Text>
              </View>
            </View>

            {/* Before / After Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'after' && styles.tabActive]}
                onPress={() => setActiveTab('after')}>
                <Text style={[styles.tabText, activeTab === 'after' && styles.tabTextActive]}>
                  📸 After Photos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'before' && styles.tabActive]}
                onPress={() => setActiveTab('before')}>
                <Text style={[styles.tabText, activeTab === 'before' && styles.tabTextActive]}>
                  📷 Before
                </Text>
              </TouchableOpacity>
            </View>

            {/* Photo Area */}
            <TouchableOpacity
              style={styles.photoArea}
              onPress={handleAddPhoto}
              activeOpacity={0.8}>
              <Text style={styles.photoAreaIcon}>📷</Text>
              <Text style={styles.photoAreaText}>Tap to take a photo</Text>
              <Text style={styles.photoAreaSub}>or tap + below to add more</Text>
            </TouchableOpacity>

            {/* Thumbnails */}
            <View style={styles.thumbRow}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.thumb}>
                  <Text style={styles.thumbEmoji}>{photo}</Text>
                  <View style={styles.thumbCheck}>
                    <Text style={styles.thumbCheckText}>✓</Text>
                  </View>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={styles.thumbAdd} onPress={handleAddPhoto}>
                  <Text style={styles.thumbAddText}>+</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.photoCount}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} added
            </Text>

            {/* Completion Note */}
            <Text style={styles.sectionLabel}>COMPLETION NOTE</Text>
            <TouchableOpacity style={styles.noteField} activeOpacity={0.8}>
              <Text style={styles.noteText}>
                {note || 'Describe what you completed (optional)...'}
              </Text>
            </TouchableOpacity>

            {/* Quick fills */}
            <View style={styles.quickFillRow}>
              {['All areas cleaned thoroughly', 'Job completed as requested', 'Customer inspected'].map(text => (
                <TouchableOpacity
                  key={text}
                  style={styles.quickFillChip}
                  onPress={() => setNote(text)}>
                  <Text style={styles.quickFillText}>{text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* GPS Notice */}
            <View style={styles.gpsNotice}>
              <Text style={styles.gpsNoticeText}>
                📍 Photos are automatically tagged with your GPS location and timestamp
              </Text>
            </View>

            {/* Submit Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnLoading]}
                onPress={handleSubmitProof}
                disabled={submitting}
                activeOpacity={0.85}>
                <Text style={styles.submitBtnText}>
                  {submitting ? '⏳ Submitting...' : '✅ Submit Proof & Clock Out'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.submitHint}>
              This will notify {MOCK_JOB.customerName} to confirm the job
            </Text>

          </Animated.View>
        )}

        {/* SOS — always visible */}
        <TouchableOpacity style={styles.sosBtn} onPress={() => {}}>
          <Text style={styles.sosBtnText}>🚨 Emergency SOS</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12,
  },
  backBtn: { paddingVertical: 6, paddingRight: 8 },
  backBtnText: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#E8E8EA' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#171719',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  stepBadge: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  stepBadgeText: { fontSize: 11, color: '#888890', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  jobBanner: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16,
  },
  jobBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jobIcon: { fontSize: 32 },
  jobBannerInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '800', color: '#E8E8EA' },
  jobCustomer: { fontSize: 12, color: '#888890', marginTop: 2 },
  jobRate: { alignItems: 'flex-end' },
  jobRateAmount: { fontSize: 20, fontWeight: '800', color: '#C9A84C' },
  jobRateType: { fontSize: 11, color: '#888890' },
  jobBannerDivider: { height: 1, backgroundColor: '#2E2E33', marginVertical: 12 },
  jobTagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  jobTag: {
    backgroundColor: '#0E0E0F', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  jobTagText: { fontSize: 11, color: '#888890' },

  gpsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  gpsIcon: { fontSize: 20 },
  gpsText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  actionBtnBlue: {
    backgroundColor: 'rgba(85,153,224,0.08)', borderColor: 'rgba(85,153,224,0.3)',
  },
  actionBtnIcon: { fontSize: 20 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#888890' },

  clockInBtn: {
    backgroundColor: '#C9A84C', borderRadius: 18, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  clockInBtnDisabled: {
    backgroundColor: '#1E1E21', borderWidth: 1, borderColor: '#2E2E33',
    shadowOpacity: 0, elevation: 0,
  },
  clockInBtnIcon: { fontSize: 22 },
  clockInBtnText: { fontSize: 18, fontWeight: '800', color: '#0E0E0F' },
  gpsHint: { textAlign: 'center', fontSize: 12, color: '#555558', marginTop: -4 },

  timerCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 8,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  timerLabel: { fontSize: 10, fontWeight: '800', color: '#888890', letterSpacing: 2 },
  timerDigits: {
    fontSize: 52, fontWeight: '800', color: '#C9A84C',
    letterSpacing: 3, fontVariant: ['tabular-nums'],
  },
  gpsBadge: {
    backgroundColor: 'rgba(76,175,122,0.12)', borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 4,
  },
  gpsBadgeText: { fontSize: 11, color: '#4CAF7A', fontWeight: '600' },

  earningsRow: { flexDirection: 'row', gap: 10 },
  earningsCard: {
    flex: 1, backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 16, alignItems: 'center', gap: 4,
  },
  earningsLabel: {
    fontSize: 10, color: '#888890', fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  earningsAmount: {
    fontSize: 26, fontWeight: '800', color: '#C9A84C', fontVariant: ['tabular-nums'],
  },

  clockOutBtn: {
    backgroundColor: '#171719', borderWidth: 2, borderColor: '#E05252',
    borderRadius: 18, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  clockOutBtnIcon: { fontSize: 20 },
  clockOutBtnText: { fontSize: 16, fontWeight: '800', color: '#E05252' },

  // Proof phase
  instructionCard: {
    backgroundColor: 'rgba(201,168,76,0.06)', borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  instructionIcon: { fontSize: 24 },
  instructionText: { flex: 1 },
  instructionTitle: { fontSize: 14, fontWeight: '800', color: '#E8E8EA', marginBottom: 4 },
  instructionSub: { fontSize: 12, color: '#888890', lineHeight: 18 },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 4, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#C9A84C' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#888890' },
  tabTextActive: { color: '#0E0E0F' },

  photoArea: {
    backgroundColor: '#111113', borderWidth: 2, borderColor: '#2E2E33',
    borderStyle: 'dashed', borderRadius: 20, height: 150,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoAreaIcon: { fontSize: 36 },
  photoAreaText: { fontSize: 14, fontWeight: '700', color: '#888890' },
  photoAreaSub: { fontSize: 11, color: '#555558' },

  thumbRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  thumb: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  thumbEmoji: { fontSize: 28 },
  thumbCheck: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#4CAF7A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#0E0E0F',
  },
  thumbCheckText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },
  thumbAdd: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  thumbAddText: { fontSize: 28, color: '#555558', fontWeight: '300' },
  photoCount: {
    fontSize: 12, color: '#4CAF7A', fontWeight: '600', textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#888890', letterSpacing: 1.5,
  },
  noteField: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 16, minHeight: 80,
  },
  noteText: { fontSize: 13, color: '#555558', lineHeight: 20 },

  quickFillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickFillChip: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
  },
  quickFillText: { fontSize: 11, color: '#888890', fontWeight: '600' },

  gpsNotice: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 12, padding: 12,
  },
  gpsNoticeText: { fontSize: 11, color: '#555558', textAlign: 'center', lineHeight: 16 },

  submitBtn: {
    backgroundColor: '#4CAF7A', borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#4CAF7A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnLoading: { backgroundColor: '#2E2E33', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#0E0E0F' },
  submitHint: { textAlign: 'center', fontSize: 12, color: '#555558', marginTop: -4 },

  sosBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  sosBtnText: { fontSize: 13, color: '#555558', fontWeight: '600' },
});