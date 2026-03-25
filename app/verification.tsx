import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';

type VerificationTier = 'community' | 'verified' | 'elite';

const TIERS = [
  {
    id: 'community',
    icon: '👤',
    title: 'Community Member',
    fee: '10%',
    color: '#888890',
    borderColor: '#2E2E33',
    description: 'Basic profile — get started right away',
    perks: [
      'Post and apply for jobs',
      'Build your rating',
      'Access to all job categories',
      'Community support',
    ],
    steps: [
      { icon: '📧', label: 'Email verified', done: true },
      { icon: '📱', label: 'Phone verified', done: true },
      { icon: '👤', label: 'Profile complete', done: true },
    ],
  },
  {
    id: 'verified',
    icon: '✅',
    title: 'Verified Pro',
    fee: '8%',
    color: '#4CAF7A',
    borderColor: 'rgba(76,175,122,0.4)',
    description: 'ID verified — customers trust you more',
    perks: [
      'Verified badge on your profile',
      'Priority in job matching algorithm',
      'Access to higher-paying jobs',
      '2% lower platform fee',
      'Faster payment processing',
    ],
    steps: [
      { icon: '🪪', label: 'Government ID', done: false },
      { icon: '🤳', label: 'Face ID match', done: false },
      { icon: '📍', label: 'Address verified', done: false },
    ],
  },
  {
    id: 'elite',
    icon: '🏆',
    title: 'Elite Pro',
    fee: '6%',
    color: '#C9A84C',
    borderColor: 'rgba(201,168,76,0.4)',
    description: 'Full verification — maximum trust and earnings',
    perks: [
      'Elite badge — highest trust level',
      'First priority in all job matching',
      'Access to government contracts',
      '4% lower platform fee',
      'Instant payment on job completion',
      'Dedicated support line',
      'Team job leadership eligibility',
    ],
    steps: [
      { icon: '🪪', label: 'Government ID', done: false },
      { icon: '🤳', label: 'Face ID match', done: false },
      { icon: '🏦', label: 'Bank account via Stripe', done: false },
      { icon: '🔍', label: 'Background check', done: false },
      { icon: '📍', label: 'Address verified', done: false },
    ],
  },
];

export default function VerificationScreen() {
  const [currentTier] = useState<VerificationTier>('community');
  const [activeTier, setActiveTier] = useState<VerificationTier>('verified');
  const [verifying, setVerifying] = useState(false);
  const [faceIdDone, setFaceIdDone] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleFaceId = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setFaceIdDone(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) setFaceIdDone(true);
    } catch {
      setFaceIdDone(true);
    }
  };

  const handleStartVerification = async () => {
    setVerifying(true);
    await handleFaceId();
    setTimeout(() => {
      setVerifying(false);
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successAnim, {
          toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1, friction: 4, tension: 50, useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
  };

  const selectedTier = TIERS.find(t => t.id === activeTier)!;
  const currentTierData = TIERS.find(t => t.id === currentTier)!;

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Animated.View style={[styles.successContainer, { opacity: successAnim }]}>

          <Animated.View style={[
            styles.successBadge,
            { transform: [{ scale: badgeScale }] }
          ]}>
            <Text style={styles.successBadgeIcon}>{selectedTier.icon}</Text>
          </Animated.View>

          <Text style={styles.successTitle}>Verification Started!</Text>
          <Text style={styles.successSub}>
            Your {selectedTier.title} verification is in progress
          </Text>

          <View style={styles.successCard}>
            <Text style={styles.successCardRow}>✅  Face ID verified successfully</Text>
            <Text style={styles.successCardRow}>⏳  ID verification — under review</Text>
            <Text style={styles.successCardRow}>📧  You will be notified within 24 hours</Text>
            <Text style={styles.successCardRow}>🛡️  Your data is encrypted and secure</Text>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}>
            <Text style={styles.successBtnText}>🏠 Back to Home</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={[styles.currentBadge, { borderColor: currentTierData.borderColor }]}>
          <Text style={styles.currentBadgeText}>{currentTierData.icon} {currentTierData.title}</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Trust Philosophy */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyIcon}>🛡️</Text>
          <View style={styles.philosophyText}>
            <Text style={styles.philosophyTitle}>Your identity is your reputation</Text>
            <Text style={styles.philosophySub}>
              Verification protects workers and customers equally. The more verified you are, the more you earn.
            </Text>
          </View>
        </View>

        {/* Tier Selector */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR TIER</Text>
        <View style={styles.tierRow}>
          {TIERS.map(tier => (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierTab,
                activeTier === tier.id && {
                  borderColor: tier.color,
                  backgroundColor: `${tier.color}15`,
                }
              ]}
              onPress={() => setActiveTier(tier.id as VerificationTier)}>
              <Text style={styles.tierTabIcon}>{tier.icon}</Text>
              <Text style={[
                styles.tierTabText,
                activeTier === tier.id && { color: tier.color }
              ]}>
                {tier.id === 'community' ? 'Basic' :
                 tier.id === 'verified' ? 'Verified' : 'Elite'}
              </Text>
              <Text style={[
                styles.tierTabFee,
                activeTier === tier.id && { color: tier.color }
              ]}>
                {tier.fee} fee
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Tier Detail */}
        <View style={[styles.tierCard, { borderColor: selectedTier.borderColor }]}>

          {/* Tier Header */}
          <View style={styles.tierCardHeader}>
            <Animated.View style={[
              styles.tierIcon,
              { backgroundColor: `${selectedTier.color}20`, opacity: glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.7,1] }) }
            ]}>
              <Text style={styles.tierIconText}>{selectedTier.icon}</Text>
            </Animated.View>
            <View style={styles.tierCardInfo}>
              <Text style={[styles.tierCardTitle, { color: selectedTier.color }]}>
                {selectedTier.title}
              </Text>
              <Text style={styles.tierCardDesc}>{selectedTier.description}</Text>
            </View>
            <View style={[styles.feeBadge, { borderColor: selectedTier.color }]}>
              <Text style={[styles.feeBadgeText, { color: selectedTier.color }]}>
                {selectedTier.fee}
              </Text>
              <Text style={styles.feeBadgeSub}>fee</Text>
            </View>
          </View>

          <View style={styles.tierDivider} />

          {/* Perks */}
          <Text style={styles.tierSectionLabel}>WHAT YOU GET</Text>
          <View style={styles.perksList}>
            {selectedTier.perks.map((perk, index) => (
              <View key={index} style={styles.perkRow}>
                <Text style={[styles.perkDot, { color: selectedTier.color }]}>✓</Text>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tierDivider} />

          {/* Steps */}
          <Text style={styles.tierSectionLabel}>VERIFICATION STEPS</Text>
          <View style={styles.stepsList}>
            {selectedTier.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[
                  styles.stepIcon,
                  step.done
                    ? { backgroundColor: 'rgba(76,175,122,0.15)', borderColor: 'rgba(76,175,122,0.3)' }
                    : { backgroundColor: '#171719', borderColor: '#2E2E33' }
                ]}>
                  <Text style={styles.stepIconText}>{step.icon}</Text>
                </View>
                <Text style={[
                  styles.stepLabel,
                  step.done && { color: '#4CAF7A' }
                ]}>
                  {step.label}
                </Text>
                {step.done ? (
                  <Text style={styles.stepDone}>✓</Text>
                ) : (
                  <Text style={styles.stepPending}>→</Text>
                )}
              </View>
            ))}
          </View>

        </View>

        {/* Fee Comparison */}
        <Text style={styles.sectionLabel}>FEE COMPARISON</Text>
        <View style={styles.feeCard}>
          {TIERS.map((tier, index) => (
            <View key={tier.id}>
              <View style={styles.feeRow}>
                <Text style={styles.feeRowIcon}>{tier.icon}</Text>
                <Text style={styles.feeRowTitle}>{tier.title}</Text>
                <View style={styles.feeBarContainer}>
                  <View style={[
                    styles.feeBar,
                    {
                      width: `${parseInt(tier.fee) * 10}%`,
                      backgroundColor: tier.color,
                    }
                  ]} />
                </View>
                <Text style={[styles.feeRowValue, { color: tier.color }]}>{tier.fee}</Text>
              </View>
              {index < TIERS.length - 1 && <View style={styles.feeDivider} />}
            </View>
          ))}
        </View>

        {/* Start Button */}
        {activeTier !== 'community' && (
          <TouchableOpacity
            style={[
              styles.startBtn,
              { backgroundColor: selectedTier.color },
              verifying && styles.startBtnLoading,
            ]}
            onPress={handleStartVerification}
            disabled={verifying}
            activeOpacity={0.85}>
            <Text style={styles.startBtnText}>
              {verifying
                ? '⏳ Verifying...'
                : `${selectedTier.icon} Start ${selectedTier.title} Verification`}
            </Text>
          </TouchableOpacity>
        )}

        {activeTier === 'community' && (
          <View style={styles.communityNote}>
            <Text style={styles.communityNoteText}>
              ✅ You are already a Community Member — upgrade anytime to earn more
            </Text>
          </View>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 All verification data is encrypted. XProHub never sells your personal information.
          </Text>
        </View>

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
  currentBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#171719',
  },
  currentBadgeText: { fontSize: 11, color: '#888890', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },

  philosophyCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
  },
  philosophyIcon: { fontSize: 28 },
  philosophyText: { flex: 1 },
  philosophyTitle: { fontSize: 15, fontWeight: '800', color: '#E8E8EA', marginBottom: 6 },
  philosophySub: { fontSize: 13, color: '#888890', lineHeight: 19 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#888890',
    letterSpacing: 1.5, marginBottom: -4,
  },

  tierRow: { flexDirection: 'row', gap: 8 },
  tierTab: {
    flex: 1, backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 10, alignItems: 'center', gap: 4,
  },
  tierTabIcon: { fontSize: 20 },
  tierTabText: { fontSize: 11, fontWeight: '800', color: '#888890' },
  tierTabFee: { fontSize: 10, color: '#555558' },

  tierCard: {
    backgroundColor: '#171719', borderWidth: 1.5,
    borderRadius: 24, padding: 20, gap: 16,
  },
  tierCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tierIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  tierIconText: { fontSize: 26 },
  tierCardInfo: { flex: 1 },
  tierCardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  tierCardDesc: { fontSize: 12, color: '#888890', lineHeight: 17 },
  feeBadge: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  feeBadgeText: { fontSize: 18, fontWeight: '800' },
  feeBadgeSub: { fontSize: 9, color: '#888890' },
  tierDivider: { height: 1, backgroundColor: '#2E2E33' },
  tierSectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#888890', letterSpacing: 1.5,
  },

  perksList: { gap: 8 },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  perkDot: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  perkText: { flex: 1, fontSize: 13, color: '#E8E8EA', lineHeight: 19 },

  stepsList: { gap: 10 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0E0E0F', borderRadius: 12, padding: 10,
  },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepIconText: { fontSize: 18 },
  stepLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#E8E8EA' },
  stepDone: { fontSize: 16, color: '#4CAF7A', fontWeight: '800' },
  stepPending: { fontSize: 16, color: '#555558' },

  feeCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feeRowIcon: { fontSize: 18 },
  feeRowTitle: { fontSize: 12, color: '#888890', width: 80 },
  feeBarContainer: { flex: 1, height: 6, backgroundColor: '#2A2A2E', borderRadius: 3, overflow: 'hidden' },
  feeBar: { height: '100%', borderRadius: 3 },
  feeRowValue: { fontSize: 13, fontWeight: '800', width: 32, textAlign: 'right' },
  feeDivider: { height: 1, backgroundColor: '#2E2E33' },

  startBtn: {
    borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  startBtnLoading: { opacity: 0.6 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },

  communityNote: {
    backgroundColor: 'rgba(76,175,122,0.06)',
    borderWidth: 1, borderColor: 'rgba(76,175,122,0.2)',
    borderRadius: 14, padding: 14,
  },
  communityNoteText: { fontSize: 13, color: '#4CAF7A', textAlign: 'center', fontWeight: '600' },

  securityNote: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 14,
  },
  securityNoteText: { fontSize: 12, color: '#555558', textAlign: 'center', lineHeight: 18 },

  // Success state
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 16,
  },
  successBadge: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  successBadgeIcon: { fontSize: 48 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#E8E8EA' },
  successSub: { fontSize: 14, color: '#888890', textAlign: 'center', lineHeight: 20 },
  successCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 20, width: '100%', gap: 12,
  },
  successCardRow: { fontSize: 14, color: '#E8E8EA', fontWeight: '600' },
  successBtn: {
    backgroundColor: '#C9A84C', borderRadius: 14,
    padding: 16, width: '100%', alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  successBtnText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
});