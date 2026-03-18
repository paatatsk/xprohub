import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';
import HomeBeacon from '../components/HomeBeacon';
const WORKERS = [
  {
    id: 1,
    name: 'Sofia Rodriguez',
    role: 'Home Cleaning Specialist',
    rating: 4.9,
    reviews: 84,
    price: 25,
    distance: 0.2,
    level: '⚡ Trusted Expert',
    reliability: 99,
    avatar: 'SR',
    color: '#C9A84C',
    matchScore: 94,
    matchReasons: ['Perfect skill match', 'Closest to you', '99% reliable'],
    badges: ['★ Top Pro', '✓ Verified', '🛡 Insured'],
    skills: ['Cleaning', 'Organizing'],
  },
  {
    id: 2,
    name: 'James Lee',
    role: 'General Home Services',
    rating: 4.8,
    reviews: 48,
    price: 20,
    distance: 0.5,
    level: '🌟 Rising Pro',
    reliability: 97,
    avatar: 'JL',
    color: '#4CAF7A',
    matchScore: 78,
    matchReasons: ['Good skill match', 'Competitive price'],
    badges: ['✓ Verified', '48 Jobs Done'],
    skills: ['Cleaning', 'Moving'],
  },
  {
    id: 3,
    name: 'Aisha Malik',
    role: 'Professional Cleaner',
    rating: 4.9,
    reviews: 62,
    price: 22,
    distance: 0.8,
    level: '⭐ Elite Pro',
    reliability: 100,
    avatar: 'AM',
    color: '#9B6EE8',
    matchScore: 86,
    matchReasons: ['100% reliable', 'Excellent reviews'],
    badges: ['✓ Verified', '62 Jobs Done'],
    skills: ['Deep Clean', 'Move-In/Out'],
  },
  {
    id: 4,
    name: 'Carlos Martinez',
    role: 'Home & Office Cleaning',
    rating: 4.7,
    reviews: 31,
    price: 18,
    distance: 1.1,
    level: '🌟 Rising Pro',
    reliability: 95,
    avatar: 'CM',
    color: '#5599E0',
    matchScore: 61,
    matchReasons: ['Budget friendly', 'Growing reputation'],
    badges: ['✓ Verified'],
    skills: ['Cleaning', 'Errands'],
  },
];

const FILTERS = ['⭐ Top Rated', '📍 Nearest', '💰 Price', '🛡 Insured'];

export default function WorkerMatchScreen() {
  const [selectedFilter, setSelectedFilter] = useState('⭐ Top Rated');
  const [selectedWorker, setSelectedWorker] = useState(WORKERS[0]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Workers Found! 🎉</Text>
          <Text style={styles.headerSub}>4 workers available near you</Text>
          <HomeBeacon />
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>4</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}>
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mini Map */}
      <View style={styles.miniMap}>
        <View style={styles.youPin}>
          <Text style={styles.youPinText}>📍</Text>
          <Text style={styles.youLabel}>You</Text>
        </View>
        <View style={[styles.workerPin, { top: '25%', left: '30%' }]}>
          <Text style={styles.workerPinText}>SR</Text>
        </View>
        <View style={[styles.workerPin, styles.workerPinGreen, { top: '35%', left: '65%' }]}>
          <Text style={styles.workerPinText}>JL</Text>
        </View>
        <View style={[styles.workerPin, styles.workerPinPurple, { top: '65%', left: '45%' }]}>
          <Text style={styles.workerPinText}>AM</Text>
        </View>
        <View style={[styles.workerPin, styles.workerPinBlue, { top: '20%', left: '60%' }]}>
          <Text style={styles.workerPinText}>CM</Text>
        </View>
        <View style={styles.mapLabel}>
          <Text style={styles.mapLabelText}>🧹 Deep Cleaning · $50 · ASAP</Text>
        </View>
      </View>

      {/* Worker Cards */}
      <ScrollView style={styles.workerList} showsVerticalScrollIndicator={false}>
        {WORKERS.map((worker) => (
          <TouchableOpacity
            key={worker.id}
            style={[styles.workerCard, selectedWorker?.id === worker.id && styles.workerCardSelected]}
            onPress={() => router.push('/worker-profile')}>

            {/* Match Score Bar */}
            <View style={styles.matchScoreRow}>
              <View style={styles.matchScoreBarBg}>
                <View style={[styles.matchScoreBarFill, {
                  width: `${worker.matchScore}%`,
                  backgroundColor: worker.matchScore >= 90 ? '#4CAF7A' : worker.matchScore >= 75 ? '#C9A84C' : '#5599E0'
                }]} />
              </View>
              <Text style={[styles.matchScoreText, {
                color: worker.matchScore >= 90 ? '#4CAF7A' : worker.matchScore >= 75 ? '#C9A84C' : '#5599E0'
              }]}>
                {worker.matchScore}% Match
              </Text>
            </View>

            {/* Match Reasons */}
            <View style={styles.matchReasons}>
              {worker.matchReasons.map((reason, i) => (
                <View key={i} style={styles.matchReason}>
                  <Text style={styles.matchReasonText}>✓ {reason}</Text>
                </View>
              ))}
            </View>

            {/* Card Top */}
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: worker.color }]}>
                <Text style={styles.avatarText}>{worker.avatar}</Text>
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerRole}>{worker.role}</Text>
                <View style={styles.skillRow}>
                  {worker.skills.map(s => (
                    <View key={s} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>${worker.price}</Text>
                <Text style={styles.priceLabel}>/hr</Text>
                <Text style={styles.distance}>📍 {worker.distance} mi</Text>
              </View>
            </View>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {worker.badges.map(b => (
                <View key={b} style={styles.badge}>
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
              <View style={styles.reliabilityBadge}>
                <Text style={styles.reliabilityText}>⚡ {worker.reliability}% reliable</Text>
              </View>
            </View>

            {/* Card Bottom */}
            <View style={styles.cardBottom}>
              <Text style={styles.stars}>★★★★★</Text>
              <Text style={styles.reviews}>{worker.rating} · {worker.reviews} reviews</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{worker.level}</Text>
              </View>
            </View>

          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Golden Dollar + Hire Button */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <GoldenDollar size="small" speed="normal" pulse={true} glow={true} />
      </View>
      <View style={styles.hireBar}>
        <TouchableOpacity
          style={styles.hireButton}
          onPress={() => router.push('/worker-profile')}>
          <Text style={styles.hireButtonText}>
            Hire {selectedWorker?.name.split(' ')[0]} — ${selectedWorker?.price}/hr 🎉
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#E8E8EA' },
  headerSub: { fontSize: 12, color: '#888890', marginTop: 2 },
  headerBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: '#C9A84C', fontSize: 14, fontWeight: '800' },
  filterBar: { maxHeight: 44, marginBottom: 8 },
  filterBarContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    backgroundColor: '#171719', borderWidth: 1,
    borderColor: '#2E2E33', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  filterText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  filterTextActive: { color: '#C9A84C' },
  miniMap: {
    height: 130, backgroundColor: '#111113',
    marginHorizontal: 16, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: '#2E2E33', marginBottom: 12,
  },
  youPin: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -12 }, { translateY: -24 }],
    alignItems: 'center',
  },
  youPinText: { fontSize: 20 },
  youLabel: { fontSize: 9, color: '#C9A84C', fontWeight: '700' },
  workerPin: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 1, borderColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
  },
  workerPinGreen: { backgroundColor: 'rgba(76,175,122,0.2)', borderColor: '#4CAF7A' },
  workerPinPurple: { backgroundColor: 'rgba(155,110,232,0.2)', borderColor: '#9B6EE8' },
  workerPinBlue: { backgroundColor: 'rgba(85,153,224,0.2)', borderColor: '#5599E0' },
  workerPinText: { fontSize: 8, fontWeight: '800', color: '#E8E8EA' },
  mapLabel: {
    position: 'absolute', bottom: 8, right: 10,
    backgroundColor: 'rgba(14,14,15,0.85)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#2E2E33',
  },
  mapLabelText: { fontSize: 10, color: '#888890' },
  workerList: { flex: 1, paddingHorizontal: 16 },
  workerCard: {
    backgroundColor: '#171719', borderWidth: 1,
    borderColor: '#2E2E33', borderRadius: 16,
    padding: 14, marginBottom: 10,
  },
  workerCardSelected: {
    borderColor: 'rgba(201,168,76,0.5)',
    backgroundColor: 'rgba(201,168,76,0.04)',
  },

  // Match Score
  matchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  matchScoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#2E2E33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchScoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: '800',
    width: 70,
    textAlign: 'right',
  },
  matchReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  matchReason: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchReasonText: {
    fontSize: 10,
    color: '#C9A84C',
    fontWeight: '600',
  },

  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { color: '#0E0E0F', fontSize: 14, fontWeight: '800' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  workerRole: { fontSize: 11, color: '#888890', marginTop: 2 },
  skillRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  skillChip: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  skillChipText: { fontSize: 9, color: '#C9A84C', fontWeight: '600' },
  priceBlock: { alignItems: 'flex-end' },
  price: { fontSize: 18, fontWeight: '800', color: '#C9A84C' },
  priceLabel: { fontSize: 10, color: '#888890' },
  distance: { fontSize: 10, color: '#888890', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1, borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 10, color: '#4CAF7A', fontWeight: '700' },
  reliabilityBadge: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  reliabilityText: { fontSize: 10, color: '#C9A84C', fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { fontSize: 12, color: '#C9A84C' },
  reviews: { fontSize: 11, color: '#888890', flex: 1 },
  levelBadge: {
    backgroundColor: 'rgba(155,110,232,0.1)',
    borderWidth: 1, borderColor: 'rgba(155,110,232,0.2)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  levelText: { fontSize: 10, color: '#9B6EE8', fontWeight: '700' },
  hireBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32,
    backgroundColor: 'rgba(14,14,15,0.95)',
    borderTopWidth: 1, borderTopColor: '#2E2E33',
  },
  hireButton: {
    backgroundColor: '#C9A84C', borderRadius: 14,
    padding: 16, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  hireButtonText: { color: '#0E0E0F', fontSize: 15, fontWeight: '800' },
});