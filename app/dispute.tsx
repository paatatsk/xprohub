import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';

type DisputePhase = 'reason' | 'evidence' | 'submitted' | 'resolved';

const REASONS = [
  { icon: '🔨', label: 'Work quality issue', desc: 'Job not completed to standard' },
  { icon: '🚫', label: 'Worker no show', desc: 'Worker never arrived' },
  { icon: '💰', label: 'Payment dispute', desc: 'Incorrect amount charged' },
  { icon: '⏰', label: 'Late arrival', desc: 'Worker arrived significantly late' },
  { icon: '🛡️', label: 'Safety concern', desc: 'I felt unsafe during the job' },
  { icon: '📋', label: 'Other', desc: 'Something else happened' },
];

const EVIDENCE_OPTIONS = [
  { icon: '📸', label: 'Photos', desc: 'Before or after photos' },
  { icon: '💬', label: 'Chat messages', desc: 'Conversation history' },
  { icon: '📍', label: 'GPS records', desc: 'Location data' },
  { icon: '🕐', label: 'Time records', desc: 'Clock in/out times' },
];

const TIMELINE = [
  { icon: '📋', label: 'Dispute opened', time: 'Just now', done: true, color: '#C9A84C' },
  { icon: '🔍', label: 'Under review', time: 'Within 2 hours', done: false, color: '#4A9EDB' },
  { icon: '⚖️', label: 'Mediator assigned', time: 'Within 24 hours', done: false, color: '#9B6EE8' },
  { icon: '✅', label: 'Resolution reached', time: 'Within 48 hours', done: false, color: '#4CAF7A' },
];

export default function DisputeScreen() {
  const [phase, setPhase] = useState<DisputePhase>('reason');
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    if (phase === 'reason' && selectedReason !== null) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setPhase('evidence');
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    Animated.timing(progressAnim, {
      toValue: 1, duration: 1500, useNativeDriver: false,
    }).start(() => {
      setSubmitting(false);
      setPhase('submitted');
      Animated.spring(successAnim, {
        toValue: 1, friction: 5, tension: 40, useNativeDriver: true,
      }).start();
    });
  };

  const toggleEvidence = (index: number) => {
    setSelectedEvidence(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // ── SUBMITTED STATE ──
  if (phase === 'submitted') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Text style={styles.backBtn}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dispute Filed</Text>
          <View style={styles.caseIdBadge}>
            <Text style={styles.caseIdText}>#DSP-4821</Text>
          </View>
        </View>

        <Animated.ScrollView
          style={[styles.scroll, { opacity: successAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Success Header */}
          <Animated.View style={[
            styles.successCard,
            { transform: [{ scale: successAnim.interpolate({ inputRange: [0,1], outputRange: [0.9,1] }) }] }
          ]}>
            <Text style={styles.successIcon}>🛡️</Text>
            <Text style={styles.successTitle}>Dispute Filed Successfully</Text>
            <Text style={styles.successSub}>
              Your case has been opened. Payment is held in escrow until resolved.
            </Text>
          </Animated.View>

          {/* What Happens Next */}
          <Text style={styles.sectionLabel}>WHAT HAPPENS NEXT</Text>
          <View style={styles.timelineCard}>
            {TIMELINE.map((item, index) => (
              <View key={index}>
                <View style={styles.timelineRow}>
                  <View style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: `${item.color}20`,
                      borderColor: item.done ? item.color : '#2E2E33',
                    }
                  ]}>
                    <Text style={styles.timelineIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.timelineInfo}>
                    <Text style={[
                      styles.timelineLabel,
                      item.done && { color: item.color }
                    ]}>
                      {item.label}
                    </Text>
                    <Text style={styles.timelineTime}>{item.time}</Text>
                  </View>
                  {item.done && (
                    <Text style={[styles.timelineDone, { color: item.color }]}>✓</Text>
                  )}
                  {!item.done && (
                    <Text style={styles.timelinePending}>○</Text>
                  )}
                </View>
                {index < TIMELINE.length - 1 && (
                  <View style={styles.timelineConnector} />
                )}
              </View>
            ))}
          </View>

          {/* Case Details */}
          <Text style={styles.sectionLabel}>YOUR CASE</Text>
          <View style={styles.caseCard}>
            <View style={styles.caseRow}>
              <Text style={styles.caseLabel}>Reason</Text>
              <Text style={styles.caseValue}>
                {selectedReason !== null ? REASONS[selectedReason].label : 'Not specified'}
              </Text>
            </View>
            <View style={styles.caseDivider} />
            <View style={styles.caseRow}>
              <Text style={styles.caseLabel}>Evidence</Text>
              <Text style={styles.caseValue}>
                {selectedEvidence.length} items submitted
              </Text>
            </View>
            <View style={styles.caseDivider} />
            <View style={styles.caseRow}>
              <Text style={styles.caseLabel}>Payment status</Text>
              <Text style={[styles.caseValue, { color: '#C9A84C' }]}>
                🔒 Held in escrow
              </Text>
            </View>
            <View style={styles.caseDivider} />
            <View style={styles.caseRow}>
              <Text style={styles.caseLabel}>Case ID</Text>
              <Text style={[styles.caseValue, { color: '#4A9EDB' }]}>#DSP-4821</Text>
            </View>
          </View>

          {/* Resolution Options */}
          <Text style={styles.sectionLabel}>POSSIBLE OUTCOMES</Text>
          <View style={styles.outcomesCard}>
            {[
              { icon: '✅', label: 'Full payment released', desc: 'If work was completed satisfactorily', color: '#4CAF7A' },
              { icon: '⚖️', label: 'Partial payment', desc: 'If work was partially completed', color: '#C9A84C' },
              { icon: '↩️', label: 'Full refund', desc: 'If work was not completed', color: '#E05252' },
            ].map((outcome, index) => (
              <View key={index}>
                <View style={styles.outcomeRow}>
                  <Text style={styles.outcomeIcon}>{outcome.icon}</Text>
                  <View style={styles.outcomeInfo}>
                    <Text style={[styles.outcomeLabel, { color: outcome.color }]}>
                      {outcome.label}
                    </Text>
                    <Text style={styles.outcomeDesc}>{outcome.desc}</Text>
                  </View>
                </View>
                {index < 2 && <View style={styles.outcomeDivider} />}
              </View>
            ))}
          </View>

          {/* Protection Note */}
          <View style={styles.protectionCard}>
            <Text style={styles.protectionText}>
              🔒 Both parties are protected. XProHub mediators review all evidence fairly. You can appeal any decision once.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}>
            <Text style={styles.homeBtnText}>🏠 Back to Home</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  // ── FILING FORM ──
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => phase === 'evidence' ? setPhase('reason') : router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === 'reason' ? 'Open Dispute' : 'Add Evidence'}
        </Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {phase === 'reason' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          { width: phase === 'reason' ? '50%' : '100%' }
        ]} />
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Payment Protection Notice */}
        <View style={styles.protectionBanner}>
          <Text style={styles.protectionBannerIcon}>🛡️</Text>
          <View style={styles.protectionBannerInfo}>
            <Text style={styles.protectionBannerTitle}>Payment is protected</Text>
            <Text style={styles.protectionBannerSub}>
              Funds are held in escrow until this is resolved
            </Text>
          </View>
        </View>

        {/* STEP 1 — Select Reason */}
        {phase === 'reason' && (
          <>
            <Text style={styles.stepTitle}>What went wrong?</Text>
            <Text style={styles.stepSub}>
              Select the reason that best describes your situation
            </Text>
            <View style={styles.reasonsList}>
              {REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reasonCard,
                    selectedReason === index && styles.reasonCardSelected,
                  ]}
                  onPress={() => setSelectedReason(index)}
                  activeOpacity={0.8}>
                  <Text style={styles.reasonIcon}>{reason.icon}</Text>
                  <View style={styles.reasonInfo}>
                    <Text style={[
                      styles.reasonLabel,
                      selectedReason === index && { color: '#C9A84C' }
                    ]}>
                      {reason.label}
                    </Text>
                    <Text style={styles.reasonDesc}>{reason.desc}</Text>
                  </View>
                  <View style={[
                    styles.reasonCheck,
                    selectedReason === index && styles.reasonCheckSelected,
                  ]}>
                    {selectedReason === index && (
                      <Text style={styles.reasonCheckText}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.nextBtn,
                selectedReason === null && styles.nextBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={selectedReason === null}
              activeOpacity={0.85}>
              <Text style={[
                styles.nextBtnText,
                selectedReason === null && { color: '#555558' }
              ]}>
                Continue →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 — Evidence */}
        {phase === 'evidence' && (
          <>
            <Text style={styles.stepTitle}>Add your evidence</Text>
            <Text style={styles.stepSub}>
              Select what you want to include — we automatically attach relevant records
            </Text>

            <View style={styles.evidenceGrid}>
              {EVIDENCE_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.evidenceCard,
                    selectedEvidence.includes(index) && styles.evidenceCardSelected,
                  ]}
                  onPress={() => toggleEvidence(index)}
                  activeOpacity={0.8}>
                  <Text style={styles.evidenceIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.evidenceLabel,
                    selectedEvidence.includes(index) && { color: '#C9A84C' }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.evidenceDesc}>{option.desc}</Text>
                  {selectedEvidence.includes(index) && (
                    <View style={styles.evidenceCheck}>
                      <Text style={styles.evidenceCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Auto attached */}
            <View style={styles.autoCard}>
              <Text style={styles.autoTitle}>✅ Automatically included</Text>
              <Text style={styles.autoItem}>📍 GPS verification records</Text>
              <Text style={styles.autoItem}>⏰ Clock in / clock out timestamps</Text>
              <Text style={styles.autoItem}>💬 All in-app messages</Text>
              <Text style={styles.autoItem}>🪪 Worker identity verification</Text>
            </View>

            {/* Submit */}
            {submitting && (
              <View style={styles.progressBarContainer}>
                <Animated.View style={[
                  styles.submitProgress,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnLoading]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>
                {submitting ? '⏳ Filing dispute...' : '🛡️ File Dispute'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.submitNote}>
              Both parties will be notified. A mediator reviews within 24 hours.
            </Text>
          </>
        )}

        <View style={{ height: 20 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 12,
  },
  backBtn: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#E8E8EA' },
  stepBadge: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  stepBadgeText: { fontSize: 11, color: '#888890', fontWeight: '700' },
  caseIdBadge: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#4A9EDB',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  caseIdText: { fontSize: 11, color: '#4A9EDB', fontWeight: '700' },

  progressBar: {
    height: 3, backgroundColor: '#2A2A2E',
    marginHorizontal: 20, borderRadius: 2, marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#C9A84C', borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },

  protectionBanner: {
    backgroundColor: 'rgba(76,175,122,0.06)',
    borderWidth: 1, borderColor: 'rgba(76,175,122,0.2)',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  protectionBannerIcon: { fontSize: 24 },
  protectionBannerInfo: { flex: 1 },
  protectionBannerTitle: { fontSize: 14, fontWeight: '800', color: '#4CAF7A' },
  protectionBannerSub: { fontSize: 12, color: '#888890', marginTop: 2 },

  stepTitle: { fontSize: 22, fontWeight: '800', color: '#E8E8EA', marginTop: 4 },
  stepSub: { fontSize: 13, color: '#888890', lineHeight: 19, marginTop: -6 },

  reasonsList: { gap: 10 },
  reasonCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  reasonCardSelected: {
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  reasonIcon: { fontSize: 24 },
  reasonInfo: { flex: 1 },
  reasonLabel: { fontSize: 14, fontWeight: '700', color: '#E8E8EA', marginBottom: 2 },
  reasonDesc: { fontSize: 12, color: '#888890' },
  reasonCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#2E2E33',
    alignItems: 'center', justifyContent: 'center',
  },
  reasonCheckSelected: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  reasonCheckText: { fontSize: 12, color: '#0E0E0F', fontWeight: '800' },

  nextBtn: {
    backgroundColor: '#C9A84C', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  nextBtnDisabled: {
    backgroundColor: '#1E1E21', borderWidth: 1, borderColor: '#2E2E33',
    shadowOpacity: 0, elevation: 0,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },

  evidenceGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  evidenceCard: {
    width: '47%', backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 14, gap: 6,
    position: 'relative',
  },
  evidenceCardSelected: {
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  evidenceIcon: { fontSize: 28 },
  evidenceLabel: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  evidenceDesc: { fontSize: 11, color: '#888890' },
  evidenceCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center',
  },
  evidenceCheckText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },

  autoCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 16, gap: 8,
  },
  autoTitle: { fontSize: 13, fontWeight: '800', color: '#4CAF7A', marginBottom: 4 },
  autoItem: { fontSize: 13, color: '#888890' },

  progressBarContainer: {
    height: 4, backgroundColor: '#2A2A2E', borderRadius: 2, overflow: 'hidden',
  },
  submitProgress: { height: '100%', backgroundColor: '#C9A84C', borderRadius: 2 },

  submitBtn: {
    backgroundColor: '#E05252', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#E05252', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnLoading: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  submitNote: {
    textAlign: 'center', fontSize: 12, color: '#555558', lineHeight: 18,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#888890',
    letterSpacing: 1.5, marginBottom: -4,
  },

  successCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 24, padding: 24, alignItems: 'center', gap: 10,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 4,
  },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#E8E8EA', textAlign: 'center' },
  successSub: { fontSize: 13, color: '#888890', textAlign: 'center', lineHeight: 19 },

  timelineCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  timelineIcon: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineIconText: { fontSize: 18 },
  timelineInfo: { flex: 1 },
  timelineLabel: { fontSize: 14, fontWeight: '700', color: '#E8E8EA' },
  timelineTime: { fontSize: 11, color: '#888890', marginTop: 2 },
  timelineDone: { fontSize: 18, fontWeight: '800' },
  timelinePending: { fontSize: 18, color: '#2E2E33' },
  timelineConnector: {
    width: 1, height: 16, backgroundColor: '#2E2E33',
    marginLeft: 19,
  },

  caseCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  caseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseLabel: { fontSize: 13, color: '#888890' },
  caseValue: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  caseDivider: { height: 1, backgroundColor: '#2E2E33' },

  outcomesCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  outcomeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  outcomeIcon: { fontSize: 22 },
  outcomeInfo: { flex: 1 },
  outcomeLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  outcomeDesc: { fontSize: 12, color: '#888890' },
  outcomeDivider: { height: 1, backgroundColor: '#2E2E33' },

  protectionCard: {
    backgroundColor: 'rgba(74,158,219,0.06)',
    borderWidth: 1, borderColor: 'rgba(74,158,219,0.2)',
    borderRadius: 14, padding: 14,
  },
  protectionText: { fontSize: 12, color: '#4A9EDB', textAlign: 'center', lineHeight: 18 },

  homeBtn: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: { color: '#E8E8EA', fontSize: 15, fontWeight: '700' },
});