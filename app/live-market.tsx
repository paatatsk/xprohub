import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions, PanResponder, ScrollView,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MOCK_JOBS = [
  {
    id: '1', icon: '🏠', category: 'Deep Cleaning', title: 'Full House Deep Clean',
    customerName: 'Marcus J.', customerBelt: '⭐', customerRating: 4.9,
    personalNote: 'Parents visiting this weekend — desperately need help getting the house ready!',
    pay: '$120', payType: 'fixed', distance: '0.8 km', postedAgo: '3 min ago',
    watchers: 6, applications: 3, heat: 'hot',
    bgEmoji: '🏡', matchScore: 94,
  },
  {
    id: '2', icon: '⚡', category: 'Electrical', title: 'Outlet Install — 3 rooms',
    customerName: 'Sarah K.', customerBelt: '🏆', customerRating: 5.0,
    personalNote: 'Setting up my home office and need 6 new outlets installed properly.',
    pay: '$85/hr', payType: 'hourly', distance: '1.2 km', postedAgo: '8 min ago',
    watchers: 2, applications: 1, heat: 'warm',
    bgEmoji: '🔌', matchScore: 88,
  },
  {
    id: '3', icon: '🐾', category: 'Pet Care', title: 'Dog Walking — 3 dogs',
    customerName: 'Elena M.', customerBelt: '⭐', customerRating: 4.8,
    personalNote: 'My three golden retrievers need their daily walk while I am at work.',
    pay: '$45', payType: 'fixed', distance: '0.4 km', postedAgo: '15 min ago',
    watchers: 8, applications: 5, heat: 'critical',
    bgEmoji: '🐕', matchScore: 91,
  },
  {
    id: '4', icon: '🎨', category: 'Painting', title: 'Living Room — 2 coats',
    customerName: 'James T.', customerBelt: '⬜', customerRating: 4.7,
    personalNote: 'Moving into a new apartment and want the living room painted before my furniture arrives.',
    pay: '$200', payType: 'fixed', distance: '2.1 km', postedAgo: '22 min ago',
    watchers: 3, applications: 2, heat: 'warm',
    bgEmoji: '🪣', matchScore: 79,
  },
  {
    id: '5', icon: '📦', category: 'Moving', title: 'Studio Apartment Move',
    customerName: 'Priya N.', customerBelt: '⭐', customerRating: 4.9,
    personalNote: 'Small studio move — just need two strong people for a few hours.',
    pay: '$35/hr', payType: 'hourly', distance: '1.8 km', postedAgo: '31 min ago',
    watchers: 4, applications: 4, heat: 'hot',
    bgEmoji: '🚚', matchScore: 85,
  },
];

const TRENDING = ['🏠 Cleaning', '⚡ Electrical', '🐾 Pet Care'];

function getHeatColor(heat: string) {
  switch (heat) {
    case 'critical': return '#E05252';
    case 'hot': return '#E8A94A';
    case 'warm': return '#4A9EDB';
    default: return '#4CAF7A';
  }
}

function getHeatLabel(heat: string) {
  switch (heat) {
    case 'critical': return '🔥 Almost gone';
    case 'hot': return '⚡ Going fast';
    case 'warm': return '👀 Active';
    default: return '🌱 Fresh';
  }
}

function getMatchColor(score: number) {
  if (score >= 90) return '#4CAF7A';
  if (score >= 80) return '#C9A84C';
  return '#4A9EDB';
}

export default function LiveMarketScreen() {
  const [jobIndex, setJobIndex] = useState(0);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const applyGlow = useRef(new Animated.Value(0)).current;
  const heatAnim = useRef(new Animated.Value(0)).current;
  const confirmAnim = useRef(new Animated.Value(0)).current;
  const liveAnim = useRef(new Animated.Value(1)).current;

  const currentJob = MOCK_JOBS[jobIndex % MOCK_JOBS.length];
  const nextJob = MOCK_JOBS[(jobIndex + 1) % MOCK_JOBS.length];
  const isApplied = appliedIds.includes(currentJob.id);
  const isSaved = savedIds.includes(currentJob.id);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(liveAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(liveAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (isApplied) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(applyGlow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(applyGlow, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isApplied, jobIndex]);

  useEffect(() => {
    if (currentJob.heat === 'critical' || currentJob.heat === 'hot') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(heatAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(heatAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [jobIndex]);

  const advanceCard = (direction: 'apply' | 'skip') => {
    const toX = direction === 'apply' ? width + 100 : -(width + 100);
    Animated.parallel([
      Animated.timing(swipeAnim, { toValue: { x: toX, y: 0 }, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(nextCardScale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      swipeAnim.setValue({ x: 0, y: 0 });
      fadeAnim.setValue(1);
      nextCardScale.setValue(0.95);
      setJobIndex(prev => prev + 1);
    });
  };

  const handleApply = () => {
    if (isApplied) return;
    setAppliedIds(prev => [...prev, currentJob.id]);
    setShowApplyConfirm(true);
    Animated.spring(confirmAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(confirmAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShowApplyConfirm(false);
        advanceCard('apply');
      });
    }, 1200);
  };

  const handleSkip = () => advanceCard('skip');

  const handleSave = () => {
    if (isSaved) return;
    setSavedIds(prev => [...prev, currentJob.id]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: Animated.event(
        [null, { dx: swipeAnim.x, dy: swipeAnim.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) handleApply();
        else if (g.dx < -80) handleSkip();
        else Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    })
  ).current;

  const cardRotation = swipeAnim.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-8deg', '0deg', '8deg'],
  });
  const applyOpacity = swipeAnim.x.interpolate({
    inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const skipOpacity = swipeAnim.x.interpolate({
    inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });

  const heatColor = getHeatColor(currentJob.heat);

  if (showSaved) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSaved(false)}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Jobs</Text>
          <Text style={styles.savedCount}>{savedIds.length} saved</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {MOCK_JOBS.filter(j => savedIds.includes(j.id)).map(job => (
            <TouchableOpacity key={job.id} style={styles.savedCard}>
              <Text style={styles.savedCardIcon}>{job.icon}</Text>
              <View style={styles.savedCardInfo}>
                <Text style={styles.savedCardTitle}>{job.title}</Text>
                <Text style={styles.savedCardMeta}>{job.pay} · {job.distance}</Text>
              </View>
              <View style={[styles.heatDot, { backgroundColor: getHeatColor(job.heat) }]} />
            </TouchableOpacity>
          ))}
          {savedIds.length === 0 && (
            <Text style={styles.emptyText}>
              No saved jobs yet. Tap 🔖 on any job card to save it.
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Animated.View style={[styles.liveDot, { opacity: liveAnim }]} />
          <Text style={styles.headerTitle}>Live Market</Text>
        </View>
        <TouchableOpacity style={styles.savedBtn} onPress={() => setShowSaved(true)}>
          <Text style={styles.savedBtnText}>📌 {savedIds.length}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trendingBar}>
        <Text style={styles.trendingLabel}>🔥 Trending:</Text>
        {TRENDING.map(t => (
          <View key={t} style={styles.trendingChip}>
            <Text style={styles.trendingChipText}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardStack}>

        <Animated.View style={[
          styles.cardContainer,
          styles.nextCard,
          { transform: [{ scale: nextCardScale }] }
        ]}>
          <View style={[styles.card, { backgroundColor: '#1A1A1C' }]}>
            <View style={styles.cardBgEmoji}>
              <Text style={styles.cardBgEmojiText}>{nextJob.bgEmoji}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.nextCardPay}>{nextJob.pay}</Text>
              <Text style={styles.nextCardTitle}>{nextJob.title}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateX: swipeAnim.x },
                { translateY: swipeAnim.y },
                { rotate: cardRotation },
              ],
              opacity: fadeAnim,
            }
          ]}
          {...panResponder.panHandlers}>

          <Animated.View style={[styles.swipeOverlay, styles.applyOverlay, { opacity: applyOpacity }]}>
            <Text style={styles.overlayText}>✓ APPLY</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.skipOverlay, { opacity: skipOpacity }]}>
            <Text style={styles.overlayText}>✕ SKIP</Text>
          </Animated.View>

          <View style={[styles.card, { borderColor: heatColor, borderWidth: 1.5 }]}>
            <View style={styles.cardBgEmoji}>
              <Text style={styles.cardBgEmojiText}>{currentJob.bgEmoji}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardTopBar}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryIcon}>{currentJob.icon}</Text>
                  <Text style={styles.categoryText}>{currentJob.category}</Text>
                </View>
                <View style={styles.cardTopRight}>
                  <Text style={styles.postedAgo}>{currentJob.postedAgo}</Text>
                  <Text style={styles.distance}>📍 {currentJob.distance}</Text>
                </View>
              </View>

              <View style={[
                styles.matchBadge,
                {
                  backgroundColor: `${getMatchColor(currentJob.matchScore)}22`,
                  borderColor: getMatchColor(currentJob.matchScore),
                }
              ]}>
                <Text style={[styles.matchText, { color: getMatchColor(currentJob.matchScore) }]}>
                  {currentJob.matchScore}% Match
                </Text>
              </View>

              <View style={{ flex: 1 }} />

              <View style={styles.storyCard}>
                <Text style={styles.storyText}>"{currentJob.personalNote}"</Text>
              </View>

              <View style={styles.payRow}>
                <Text style={styles.payAmount}>{currentJob.pay}</Text>
                <Text style={styles.payType}>
                  {currentJob.payType === 'hourly' ? 'per hour' : 'fixed price'}
                </Text>
              </View>

              <View style={styles.heatBar}>
                <View style={[styles.heatIndicator, { borderColor: heatColor }]}>
                  <Text style={[styles.heatText, { color: heatColor }]}>
                    {getHeatLabel(currentJob.heat)}
                  </Text>
                </View>
                <View style={styles.heatStats}>
                  <Text style={styles.heatStat}>👁 {currentJob.watchers}</Text>
                  <Text style={styles.heatStat}>📨 {currentJob.applications}</Text>
                </View>
              </View>

              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {currentJob.customerName.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{currentJob.customerName}</Text>
                  <Text style={styles.customerMeta}>
                    {currentJob.customerBelt} · ★ {currentJob.customerRating}
                  </Text>
                </View>
                {isApplied && (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>✓ Applied</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {showApplyConfirm && (
          <Animated.View style={[
            styles.confirmOverlay,
            {
              transform: [{
                scale: confirmAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
              opacity: confirmAnim,
            }
          ]}>
            <Text style={styles.confirmIcon}>✓</Text>
            <Text style={styles.confirmText}>Applied!</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipButtonText}>✕</Text>
          <Text style={styles.skipButtonLabel}>Skip</Text>
        </TouchableOpacity>

        <Animated.View style={{
          transform: [{
            scale: applyGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.04],
            }),
          }],
        }}>
          <TouchableOpacity
            style={[styles.applyButton, isApplied && styles.applyButtonDone]}
            onPress={handleApply}
            activeOpacity={0.85}
            disabled={isApplied}>
            <Text style={styles.applyButtonText}>
              {isApplied ? '✓ Applied' : '✓ Apply'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.saveButton, isSaved && styles.saveButtonDone]}
          onPress={handleSave}
          activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>{isSaved ? '📌' : '🔖'}</Text>
          <Text style={styles.saveButtonLabel}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.swipeHint}>← swipe to skip · swipe to apply →</Text>
      <Text style={styles.jobCounter}>
        {(jobIndex % MOCK_JOBS.length) + 1} of {MOCK_JOBS.length} jobs nearby
      </Text>

    </View>
  );
}

const CARD_HEIGHT = height * 0.62;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  backText: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#E05252' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#E8E8EA' },
  savedBtn: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  savedBtnText: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },
  savedCount: { fontSize: 13, color: '#888890' },
  trendingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  trendingLabel: { fontSize: 12, color: '#888890', fontWeight: '700' },
  trendingChip: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  trendingChipText: { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  cardStack: {
    flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  cardContainer: { position: 'absolute', width: width - 32, height: CARD_HEIGHT },
  nextCard: { zIndex: 1 },
  card: {
    width: '100%', height: '100%', borderRadius: 28,
    backgroundColor: '#171719', overflow: 'hidden', position: 'relative',
  },
  cardBgEmoji: { position: 'absolute', right: -20, top: -20, opacity: 0.08 },
  cardBgEmojiText: { fontSize: 200 },
  cardContent: { flex: 1, padding: 20, gap: 10 },
  swipeOverlay: {
    position: 'absolute', top: 40, zIndex: 10,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 14, borderWidth: 3,
  },
  applyOverlay: { right: 20, borderColor: '#4CAF7A', backgroundColor: 'rgba(76,175,122,0.15)' },
  skipOverlay: { left: 20, borderColor: '#E05252', backgroundColor: 'rgba(224,82,82,0.15)' },
  overlayText: { fontSize: 22, fontWeight: '900', color: '#E8E8EA', letterSpacing: 2 },
  cardTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  categoryIcon: { fontSize: 16 },
  categoryText: { fontSize: 12, color: '#E8E8EA', fontWeight: '700' },
  cardTopRight: { alignItems: 'flex-end', gap: 2 },
  postedAgo: { fontSize: 11, color: '#888890' },
  distance: { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  matchBadge: {
    alignSelf: 'flex-start', borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  matchText: { fontSize: 12, fontWeight: '800' },
  storyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  storyText: { fontSize: 13, color: '#CCCCCC', fontStyle: 'italic', lineHeight: 19 },
  payRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  payAmount: { fontSize: 42, fontWeight: '800', color: '#C9A84C', letterSpacing: -1 },
  payType: { fontSize: 14, color: '#888890' },
  heatBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heatIndicator: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heatText: { fontSize: 12, fontWeight: '700' },
  heatStats: { flexDirection: 'row', gap: 12 },
  heatStat: { fontSize: 13, color: '#888890', fontWeight: '600' },
  heatDot: { width: 10, height: 10, borderRadius: 5 },
  customerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 10,
  },
  customerAvatar: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },
  customerName: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  customerMeta: { fontSize: 11, color: '#888890' },
  appliedBadge: {
    backgroundColor: 'rgba(76,175,122,0.15)', borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.4)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  appliedBadgeText: { fontSize: 11, color: '#4CAF7A', fontWeight: '700' },
  nextCardPay: {
    fontSize: 36, fontWeight: '800', color: '#C9A84C',
    textAlign: 'center', marginTop: 80,
  },
  nextCardTitle: {
    fontSize: 16, fontWeight: '700', color: '#888890',
    textAlign: 'center', marginTop: 8,
  },
  confirmOverlay: {
    position: 'absolute', zIndex: 20,
    backgroundColor: 'rgba(76,175,122,0.95)', borderRadius: 24,
    paddingHorizontal: 40, paddingVertical: 24,
    alignItems: 'center', gap: 4,
    shadowColor: '#4CAF7A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  confirmIcon: { fontSize: 40, color: '#0E0E0F' },
  confirmText: { fontSize: 24, fontWeight: '800', color: '#0E0E0F' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingHorizontal: 20, paddingVertical: 16,
  },
  skipButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#171719',
    borderWidth: 1.5, borderColor: '#E05252',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  skipButtonText: { fontSize: 22, color: '#E05252' },
  skipButtonLabel: { fontSize: 9, color: '#E05252', fontWeight: '700' },
  applyButton: {
    height: 64, paddingHorizontal: 40, borderRadius: 32, backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  applyButtonDone: { backgroundColor: '#4CAF7A', shadowColor: '#4CAF7A' },
  applyButtonText: { fontSize: 18, fontWeight: '800', color: '#0E0E0F' },
  saveButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#171719',
    borderWidth: 1.5, borderColor: '#2E2E33',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  saveButtonDone: { borderColor: '#C9A84C' },
  saveButtonText: { fontSize: 22 },
  saveButtonLabel: { fontSize: 9, color: '#888890', fontWeight: '700' },
  swipeHint: { textAlign: 'center', fontSize: 11, color: '#444450', paddingBottom: 2 },
  jobCounter: { textAlign: 'center', fontSize: 12, color: '#555558', paddingBottom: 20 },
  savedCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  savedCardIcon: { fontSize: 28 },
  savedCardInfo: { flex: 1 },
  savedCardTitle: { fontSize: 14, fontWeight: '700', color: '#E8E8EA' },
  savedCardMeta: { fontSize: 12, color: '#888890', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#555558', fontSize: 14, marginTop: 60, lineHeight: 22 },
});