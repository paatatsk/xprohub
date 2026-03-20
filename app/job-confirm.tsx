import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JOB = {
  id: 'XPH-2026-04821',
  title: 'Deep Cleaning',
  icon: '🏠',
  workerName: 'Sofia Rodriguez',
  workerAvatar: 'S',
  workerRating: 4.97,
  workerBelt: '🟡 Yellow Belt',
  workerJobs: 48,
  clockIn: '10:00 AM',
  clockOut: '11:23 AM',
  totalHours: '1h 23m',
  amount: '$48.30',
  photos: ['🛁', '🪴', '✨'],
  note: 'Deep cleaned kitchen, bathrooms and living room. All surfaces sanitized.',
};

// Countdown timer — 24 hours in seconds (shortened to 86400)
const TOTAL_SECONDS = 86400;

export default function JobConfirmScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const handleConfirm = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setConfirmed(true);
      Animated.spring(checkAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => router.push('/tip'), 800);
      });
    });
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
        <Text style={styles.headerTitle}>Confirm Job Done?</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 2 of 3</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Worker Card */}
        <View style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{JOB.workerAvatar}</Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{JOB.workerName}</Text>
            <Text style={styles.workerMeta}>
              {JOB.workerBelt} · ★ {JOB.workerRating} · {JOB.workerJobs} jobs
            </Text>
            <View style={styles.workerTagRow}>
              <View style={styles.workerTag}>
                <Text style={styles.workerTagText}>{JOB.icon} {JOB.title}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Duration Card */}
        <View style={styles.durationCard}>
          <View style={styles.durationItem}>
            <Text style={styles.durationVal}>{JOB.clockIn}</Text>
            <Text style={styles.durationLbl}>Clocked In</Text>
          </View>
          <View style={styles.durationDivider} />
          <View style={styles.durationItem}>
            <Text style={styles.durationVal}>{JOB.clockOut}</Text>
            <Text style={styles.durationLbl}>Clocked Out</Text>
          </View>
          <View style={styles.durationDivider} />
          <View style={styles.durationItem}>
            <Text style={[styles.durationVal, { color: '#C9A84C' }]}>{JOB.totalHours}</Text>
            <Text style={styles.durationLbl}>Total Time</Text>
          </View>
          <View style={styles.durationDivider} />
          <View style={styles.durationItem}>
            <Text style={[styles.durationVal, { color: '#4CAF7A' }]}>{JOB.amount}</Text>
            <Text style={styles.durationLbl}>Amount</Text>
          </View>
        </View>

        {/* Proof Photos */}
        <Text style={styles.sectionLabel}>PROOF PHOTOS</Text>
        <View style={styles.photoGrid}>
          {JOB.photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.photoThumb,
                selectedPhoto === index && styles.photoThumbSelected,
              ]}
              onPress={() => setSelectedPhoto(selectedPhoto === index ? null : index)}
              activeOpacity={0.8}>
              <Text style={styles.photoEmoji}>{photo}</Text>
              {selectedPhoto === index && (
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoOverlayText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.photoHint}>Tap photos to expand · {JOB.photos.length} photos submitted</Text>

        {/* Completion Note */}
        {JOB.note ? (
          <>
            <Text style={styles.sectionLabel}>WORKER NOTE</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteIcon}>📝</Text>
              <Text style={styles.noteText}>{JOB.note}</Text>
            </View>
          </>
        ) : null}

        {/* Auto-release countdown */}
        <View style={styles.countdownCard}>
          <Text style={styles.countdownIcon}>⏰</Text>
          <View style={styles.countdownInfo}>
            <Text style={styles.countdownTitle}>Auto-release in</Text>
            <Text style={styles.countdownTimer}>{formatCountdown(timeLeft)}</Text>
          </View>
          <Text style={styles.countdownSub}>Payment releases automatically if not confirmed</Text>
        </View>

        {/* Confirm Button */}
        {!confirmed ? (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}>
                <Text style={styles.confirmBtnText}>✅ Confirm & Release Payment</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.issueBtn}
              onPress={() => {}}>
              <Text style={styles.issueBtnText}>⚠️ Report an Issue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Animated.View
            style={[
              styles.confirmedCard,
              {
                transform: [{
                  scale: checkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: checkAnim,
              },
            ]}>
            <Text style={styles.confirmedIcon}>🎉</Text>
            <Text style={styles.confirmedTitle}>Payment Released!</Text>
            <Text style={styles.confirmedSub}>Taking you to tipping...</Text>
          </Animated.View>
        )}

        <View style={{ height: 20 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  stepBadge: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepBadgeText: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '700',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },

  // Worker Card
  workerCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  workerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  workerAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  workerInfo: { flex: 1 },
  workerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  workerMeta: {
    fontSize: 12,
    color: '#888890',
    marginTop: 3,
  },
  workerTagRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  workerTag: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  workerTagText: {
    fontSize: 11,
    color: '#C9A84C',
    fontWeight: '700',
  },

  // Duration Card
  durationCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  durationVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  durationLbl: {
    fontSize: 10,
    color: '#888890',
    fontWeight: '600',
  },
  durationDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#2E2E33',
  },

  // Photos
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 1.5,
    marginBottom: -4,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    flex: 1,
    height: 90,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  photoThumbSelected: {
    borderColor: '#4CAF7A',
    borderWidth: 2,
  },
  photoEmoji: { fontSize: 32 },
  photoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(76,175,122,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4CAF7A',
  },
  photoHint: {
    fontSize: 11,
    color: '#555558',
    textAlign: 'center',
    marginTop: -4,
  },

  // Note
  noteCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noteIcon: { fontSize: 20 },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#888890',
    lineHeight: 20,
  },

  // Countdown
  countdownCard: {
    backgroundColor: 'rgba(232,169,74,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,169,74,0.25)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  countdownIcon: { fontSize: 22 },
  countdownInfo: { flex: 1 },
  countdownTitle: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownTimer: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8A94A',
    fontVariant: ['tabular-nums'],
  },
  countdownSub: {
    fontSize: 11,
    color: '#555558',
    width: '100%',
    marginTop: 2,
  },

  // Confirm Button
  confirmBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },

  // Issue Button
  issueBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  issueBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888890',
  },

  // Confirmed state
  confirmedCard: {
    backgroundColor: 'rgba(76,175,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  confirmedIcon: { fontSize: 40 },
  confirmedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF7A',
  },
  confirmedSub: {
    fontSize: 13,
    color: '#888890',
  },
});