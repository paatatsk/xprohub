import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JOB = {
  workerName: 'Sofia',
  workerFullName: 'Sofia Rodriguez',
  workerAvatar: 'S',
  workerRating: 4.97,
  jobTotal: 48.30,
  jobTitle: 'Deep Cleaning',
};

const PRESET_TIPS = [
  { amount: 5, label: '$5' },
  { amount: 10, label: '$10' },
  { amount: 20, label: '$20' },
  { amount: 0, label: 'Custom' },
];

export default function TipScreen() {
  const [selectedTip, setSelectedTip] = useState<number | null>(10);
  const [submitted, setSubmitted] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const tipAmount = selectedTip ?? 0;
  const totalAmount = (JOB.jobTotal + tipAmount).toFixed(2);
  const tipPercent = tipAmount > 0
    ? Math.round((tipAmount / JOB.jobTotal) * 100)
    : 0;

  const handleSelectTip = (amount: number) => {
    setSelectedTip(amount === selectedTip ? null : amount);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    Animated.parallel([
      Animated.spring(heartAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.push('/job-summary'), 900);
    });
  };

  const handleSkip = () => {
    router.push('/job-summary');
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
        <Text style={styles.headerTitle}>Add a Tip</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Worker Hero */}
        <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{JOB.workerAvatar}</Text>
          </View>
          <Animated.Text
            style={[
              styles.heartEmoji,
              {
                transform: [{
                  scale: heartAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.4, 1],
                  }),
                }],
                opacity: heartAnim,
              },
            ]}>
            ❤️
          </Animated.Text>
          <Text style={styles.heroTitle}>
            {JOB.workerName} did great work!
          </Text>
          <Text style={styles.heroSub}>
            Want to add a tip to say thanks?
          </Text>
          <View style={styles.heroRating}>
            <Text style={styles.heroRatingText}>★ {JOB.workerRating} · {JOB.jobTitle}</Text>
          </View>
        </Animated.View>

        {/* 100% notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeIcon}>⭐</Text>
          <Text style={styles.noticeText}>
            100% of your tip goes directly to {JOB.workerName} — XProHub takes nothing
          </Text>
        </View>

        {/* Tip Preset Grid */}
        <View style={styles.tipGrid}>
          {PRESET_TIPS.map((tip) => {
            const isSelected = selectedTip === tip.amount && tip.amount !== 0;
            const isCustom = tip.amount === 0;
            const isCustomSelected = isCustom && selectedTip === 0;

            return (
              <Animated.View
                key={tip.label}
                style={[
                  styles.tipBtnWrap,
                  isSelected || isCustomSelected ? { transform: [{ scale: scaleAnim }] } : {},
                ]}>
                <TouchableOpacity
                  style={[
                    styles.tipBtn,
                    (isSelected || isCustomSelected) && styles.tipBtnSelected,
                  ]}
                  onPress={() => handleSelectTip(tip.amount)}
                  activeOpacity={0.8}>
                  <Text style={[
                    styles.tipBtnAmount,
                    (isSelected || isCustomSelected) && styles.tipBtnAmountSelected,
                  ]}>
                    {tip.label}
                  </Text>
                  {tip.amount > 0 && (
                    <Text style={[
                      styles.tipBtnPct,
                      isSelected && { color: '#0E0E0F' },
                    ]}>
                      ~{Math.round((tip.amount / JOB.jobTotal) * 100)}%
                    </Text>
                  )}
                  {isCustom && (
                    <Text style={[
                      styles.tipBtnPct,
                      isCustomSelected && { color: '#0E0E0F' },
                    ]}>
                      any amount
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Payment Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Job Total</Text>
            <Text style={styles.breakdownValue}>${JOB.jobTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Tip {tipPercent > 0 ? `(${tipPercent}%)` : ''}
            </Text>
            <Text style={[
              styles.breakdownValue,
              tipAmount > 0 && { color: '#C9A84C', fontWeight: '800' },
            ]}>
              {tipAmount > 0 ? `+$${tipAmount.toFixed(2)}` : 'No tip'}
            </Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotal}>Total Charged</Text>
            <Text style={styles.breakdownTotalAmount}>${totalAmount}</Text>
          </View>
        </View>

        {/* XP Notice */}
        {tipAmount > 0 && (
          <View style={styles.xpNotice}>
            <Text style={styles.xpNoticeText}>
              ⚡ You'll earn +10 XP for tipping — thanks for being generous!
            </Text>
          </View>
        )}

        {/* Add Tip Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            submitted && styles.submitBtnLoading,
            tipAmount === 0 && styles.submitBtnNoTip,
          ]}
          onPress={handleSubmit}
          disabled={submitted}
          activeOpacity={0.85}>
          <Text style={[
            styles.submitBtnText,
            tipAmount === 0 && { color: '#888890' },
          ]}>
            {submitted
              ? '✨ Thank you!'
              : tipAmount > 0
                ? `Add $${tipAmount.toFixed(2)} Tip & Continue →`
                : 'Continue Without Tip →'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        {!submitted && tipAmount > 0 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip tip</Text>
          </TouchableOpacity>
        )}

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
    fontSize: 20,
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
    gap: 14,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 4,
  },
  heroAvatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  heartEmoji: {
    fontSize: 32,
    position: 'absolute',
    top: 16,
    right: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E8E8EA',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: '#888890',
    textAlign: 'center',
  },
  heroRating: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  heroRatingText: {
    fontSize: 12,
    color: '#C9A84C',
    fontWeight: '700',
  },

  // Notice
  noticeCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeIcon: { fontSize: 18 },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#C9A84C',
    fontWeight: '600',
    lineHeight: 18,
  },

  // Tip Grid
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipBtnWrap: {
    width: '47.5%',
  },
  tipBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  tipBtnSelected: {
    backgroundColor: '#C9A84C',
    borderColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  tipBtnAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  tipBtnAmountSelected: {
    color: '#0E0E0F',
  },
  tipBtnPct: {
    fontSize: 12,
    color: '#888890',
    fontWeight: '600',
  },

  // Breakdown
  breakdownCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#888890',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#E8E8EA',
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#2E2E33',
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  breakdownTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF7A',
  },

  // XP Notice
  xpNotice: {
    backgroundColor: 'rgba(76,175,122,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  xpNoticeText: {
    fontSize: 12,
    color: '#4CAF7A',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Submit
  submitBtn: {
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
  submitBtnLoading: {
    backgroundColor: '#4CAF7A',
    shadowColor: '#4CAF7A',
  },
  submitBtnNoTip: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E0E0F',
  },

  // Skip
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 13,
    color: '#555558',
    fontWeight: '600',
  },
});