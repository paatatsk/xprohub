import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SUMMARY = {
  jobId: 'XPH-2026-04821',
  date: 'March 20, 2026',
  jobTitle: 'Deep Cleaning',
  jobIcon: '🏠',
  workerName: 'Sofia Rodriguez',
  workerAvatar: 'S',
  workerBelt: '🟡 Yellow Belt',
  workerRating: 4.97,
  clockIn: '10:00 AM',
  clockOut: '11:23 AM',
  duration: '1h 23m',
  rate: '$35/hr',
  subtotal: 48.30,
  xprohubFee: 4.83,
  tip: 10.00,
  totalCharged: 58.30,
  workerPayout: 43.47,
  photos: ['🛁', '🪴', '✨'],
  note: 'Deep cleaned kitchen, bathrooms and living room. All surfaces sanitized.',
  xpEarned: 80,
};

export default function JobSummaryScreen() {
  const checkAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: check animates in, then content fades in, then XP bounces
    Animated.sequence([
      Animated.spring(checkAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(xpAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Complete</Text>
        <View style={styles.jobIdBadge}>
          <Text style={styles.jobIdText}>#{SUMMARY.jobId}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Success Hero */}
        <Animated.View
          style={[
            styles.successHero,
            {
              transform: [{
                scale: checkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              }],
              opacity: checkAnim,
            },
          ]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkEmoji}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Job Complete!</Text>
          <Text style={styles.successDate}>{SUMMARY.date}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentAnim, gap: 12 }}>

          {/* Worker Card */}
          <View style={styles.workerCard}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>{SUMMARY.workerAvatar}</Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{SUMMARY.workerName}</Text>
              <Text style={styles.workerMeta}>
                {SUMMARY.workerBelt} · ★ {SUMMARY.workerRating}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewProfileBtn} onPress={() => router.push('/worker-profile')}>
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Time Record */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱ Time Record</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Text style={styles.timeVal}>{SUMMARY.clockIn}</Text>
                <Text style={styles.timeLbl}>Clocked In</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={styles.timeVal}>{SUMMARY.clockOut}</Text>
                <Text style={styles.timeLbl}>Clocked Out</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={[styles.timeVal, { color: '#C9A84C' }]}>{SUMMARY.duration}</Text>
                <Text style={styles.timeLbl}>Duration</Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeItem}>
                <Text style={[styles.timeVal, { color: '#888890' }]}>{SUMMARY.rate}</Text>
                <Text style={styles.timeLbl}>Rate</Text>
              </View>
            </View>
          </View>

          {/* Payment Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💳 Payment Breakdown</Text>
            <View style={styles.breakdownList}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Job Subtotal</Text>
                <Text style={styles.breakdownVal}>${SUMMARY.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>XProHub Fee (10%)</Text>
                <Text style={styles.breakdownVal}>−${SUMMARY.xprohubFee.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tip to {SUMMARY.workerName.split(' ')[0]}</Text>
                <Text style={[styles.breakdownVal, { color: '#C9A84C' }]}>
                  +${SUMMARY.tip.toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Total Charged</Text>
                <Text style={styles.breakdownTotalVal}>${SUMMARY.totalCharged.toFixed(2)}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.payoutRow]}>
                <Text style={styles.payoutLabel}>
                  💚 {SUMMARY.workerName.split(' ')[0]} receives
                </Text>
                <Text style={styles.payoutVal}>${SUMMARY.workerPayout.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Proof Photos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📸 Proof Photos</Text>
            <View style={styles.photoRow}>
              {SUMMARY.photos.map((photo, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Text style={styles.photoEmoji}>{photo}</Text>
                </View>
              ))}
            </View>
            {SUMMARY.note ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>📝 {SUMMARY.note}</Text>
              </View>
            ) : null}
          </View>

          {/* XP Earned */}
          <Animated.View
            style={[
              styles.xpCard,
              {
                transform: [{
                  scale: xpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
                opacity: xpAnim,
              },
            ]}>
            <Text style={styles.xpIcon}>⚡</Text>
            <View style={styles.xpInfo}>
              <Text style={styles.xpTitle}>+{SUMMARY.xpEarned} XP Earned!</Text>
              <Text style={styles.xpSub}>
                Job completed · Proof submitted · Tip received
              </Text>
            </View>
          </Animated.View>

          {/* Export Buttons */}
          <View style={styles.exportRow}>
            <TouchableOpacity style={styles.exportBtn} onPress={() => {}}>
              <Text style={styles.exportBtnIcon}>📄</Text>
              <Text style={styles.exportBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => {}}>
              <Text style={styles.exportBtnIcon}>📧</Text>
              <Text style={styles.exportBtnText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => {}}>
              <Text style={styles.exportBtnIcon}>📁</Text>
              <Text style={styles.exportBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Leave Review Button */}
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => router.push('/review')}
            activeOpacity={0.85}>
            <Text style={styles.reviewBtnText}>⭐ Leave a Review</Text>
          </TouchableOpacity>

          {/* Go Home Button */}
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}>
            <Text style={styles.homeBtnText}>🏠 Back to Home</Text>
          </TouchableOpacity>

        </Animated.View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  jobIdBadge: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  jobIdText: {
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

  // Success Hero
  successHero: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76,175,122,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(76,175,122,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  checkEmoji: { fontSize: 36 },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4CAF7A',
  },
  successDate: {
    fontSize: 13,
    color: '#888890',
  },

  // Worker Card
  workerCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  workerInfo: { flex: 1 },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  workerMeta: {
    fontSize: 12,
    color: '#888890',
    marginTop: 2,
  },
  viewProfileBtn: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewProfileText: {
    fontSize: 12,
    color: '#C9A84C',
    fontWeight: '700',
  },

  // Generic Card
  card: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E8E8EA',
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  timeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  timeLbl: {
    fontSize: 10,
    color: '#888890',
    fontWeight: '600',
  },
  timeDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2E2E33',
  },

  // Breakdown
  breakdownList: { gap: 10 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#888890',
  },
  breakdownVal: {
    fontSize: 13,
    color: '#E8E8EA',
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#2E2E33',
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  breakdownTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF7A',
  },
  payoutRow: {
    backgroundColor: 'rgba(76,175,122,0.06)',
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  payoutLabel: {
    fontSize: 13,
    color: '#4CAF7A',
    fontWeight: '700',
  },
  payoutVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CAF7A',
  },

  // Photos
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    flex: 1,
    height: 72,
    backgroundColor: '#0E0E0F',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 28 },
  noteBox: {
    backgroundColor: '#0E0E0F',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#888890',
    lineHeight: 18,
  },

  // XP Card
  xpCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  xpIcon: { fontSize: 32 },
  xpInfo: { flex: 1 },
  xpTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C9A84C',
  },
  xpSub: {
    fontSize: 12,
    color: '#888890',
    marginTop: 3,
    lineHeight: 18,
  },

  // Export
  exportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  exportBtnIcon: { fontSize: 20 },
  exportBtnText: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '700',
  },

  // Review Button
  reviewBtn: {
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
  reviewBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },

  // Home Button
  homeBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888890',
  },
});