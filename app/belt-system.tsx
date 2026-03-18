import HomeBeacon from '@/components/HomeBeacon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';

const BELTS = [
  {
    belt: 'White Belt',
    emoji: '🥋',
    color: '#E8E8EA',
    bgColor: 'rgba(232,232,234,0.08)',
    borderColor: 'rgba(232,232,234,0.2)',
    jobs: '0-5 jobs',
    xp: '0 XP',
    badge: '🌱 Newcomer',
    perks: [
      'XProHub Guarantee on first 3 jobs',
      'Reduced platform fee — 5% only',
      '"Give them a chance!" feature active',
      'Mentor assigned from experienced worker',
      'Featured in Newcomer section',
    ],
    description: 'Welcome to XProHub! Every master was once a beginner. Your journey starts here.',
    current: false,
  },
  {
    belt: 'Yellow Belt',
    emoji: '🥋',
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,0.08)',
    borderColor: 'rgba(255,215,0,0.2)',
    jobs: '5-20 jobs',
    xp: '250 XP',
    badge: '⭐ Rising Star',
    perks: [
      'Standard platform fee — 10%',
      'Unlock more job categories',
      'Profile shows job completion rate',
      'Access to customer reviews',
      'Eligible for tip payments',
    ],
    description: 'You\'ve proven yourself! Customers are starting to trust your name.',
    current: false,
  },
  {
    belt: 'Orange Belt',
    emoji: '🥋',
    color: '#FF8C00',
    bgColor: 'rgba(255,140,0,0.08)',
    borderColor: 'rgba(255,140,0,0.2)',
    jobs: '20-50 jobs',
    xp: '1000 XP',
    badge: '🔥 Proven Pro',
    perks: [
      'Priority in search results',
      'Unlock squad/team features',
      'Access to premium job categories',
      'Repeat customer bonus XP',
      'Monthly performance bonus eligible',
    ],
    description: 'You\'re building real momentum. Customers seek YOU out now.',
    current: false,
  },
  {
    belt: 'Green Belt',
    emoji: '🥋',
    color: '#4CAF7A',
    bgColor: 'rgba(76,175,122,0.08)',
    borderColor: 'rgba(76,175,122,0.3)',
    jobs: '50-100 jobs',
    xp: '2500 XP',
    badge: '✅ Trusted Pro',
    perks: [
      'Can mentor White Belt newcomers',
      'Featured in Top Workers section',
      'Unlock business account clients',
      'Priority customer matching',
      'Green Belt verified badge on profile',
    ],
    description: 'You are now a trusted member of the XProHub community. Others look up to you.',
    current: true, // CURRENT LEVEL
  },
  {
    belt: 'Blue Belt',
    emoji: '🥋',
    color: '#5599E0',
    bgColor: 'rgba(85,153,224,0.08)',
    borderColor: 'rgba(85,153,224,0.3)',
    jobs: '100-200 jobs',
    xp: '5000 XP',
    badge: '💎 Elite Pro',
    perks: [
      'Featured on Explore screen homepage',
      'Reduced platform fee — 8%',
      'Access to corporate/business jobs',
      'Blue Belt profile highlight',
      'Early access to new features',
    ],
    description: 'You are among the best in your area. Elite status is a rare achievement.',
    current: false,
  },
  {
    belt: 'Brown Belt',
    emoji: '🥋',
    color: '#8B4513',
    bgColor: 'rgba(139,69,19,0.08)',
    borderColor: 'rgba(139,69,19,0.3)',
    jobs: '200-500 jobs',
    xp: '10000 XP',
    badge: '🏆 Master Pro',
    perks: [
      'Eligible for Neighborhood Captain role',
      'Revenue sharing opportunities',
      'Reduced platform fee — 6%',
      'VIP customer access',
      'XProHub Partner Program eligible',
    ],
    description: 'You have mastered your craft. The community depends on your leadership.',
    current: false,
  },
  {
    belt: 'Black Belt',
    emoji: '🥷',
    color: '#C9A84C',
    bgColor: 'rgba(201,168,76,0.08)',
    borderColor: 'rgba(201,168,76,0.4)',
    jobs: '500+ jobs',
    xp: '25000 XP',
    badge: '⚡ XPro Legend',
    perks: [
      'Platform Partner status',
      'Lowest platform fee — 5%',
      'Regional Hub Manager eligible',
      'Revenue sharing from referred workers',
      'XProHub Legend profile forever',
    ],
    description: 'You are an XPro Legend. The highest honor on the platform. You inspire everyone.',
    current: false,
  },
];

export default function BeltSystemScreen() {
  const [expandedBelt, setExpandedBelt] = useState('Green Belt');

  const currentBelt = BELTS.find(b => b.current);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Menu Button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 52, left: 20, zIndex: 99, backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1, borderColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
        onPress={() => router.push('/dev-menu')}>
        <Text style={{ color: '#888890', fontSize: 12, fontWeight: '600' }}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Belt System</Text>
        <Text style={styles.headerIcon}>🥋</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <GoldenDollar size="medium" speed="slow" pulse={true} glow={true} />
          <Text style={styles.heroTitle}>Your Journey</Text>
          <Text style={styles.heroSubtitle}>
            From White Belt newcomer to Black Belt XPro Legend — every job brings you closer to mastery
          </Text>

          {/* Current Status */}
          <View style={styles.currentStatus}>
            <View style={styles.currentStatusLeft}>
              <Text style={styles.currentStatusLabel}>YOUR CURRENT BELT</Text>
              <Text style={[styles.currentStatusBelt, { color: currentBelt?.color }]}>
                {currentBelt?.belt}
              </Text>
              <Text style={styles.currentStatusBadge}>{currentBelt?.badge}</Text>
            </View>
            <View style={styles.currentStatusRight}>
              <Text style={styles.currentStatusJobs}>84</Text>
              <Text style={styles.currentStatusJobsLabel}>jobs done</Text>
              <Text style={styles.currentStatusNext}>16 more to Blue Belt</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Green Belt Progress</Text>
              <Text style={styles.progressPercent}>84%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '84%' }]} />
            </View>
            <Text style={styles.progressNote}>84 / 100 jobs to Blue Belt</Text>
          </View>
        </View>

        {/* Newcomer Feature */}
        <View style={styles.newcomerBox}>
          <Text style={styles.newcomerIcon}>🌱</Text>
          <View style={styles.newcomerText}>
            <Text style={styles.newcomerTitle}>New to XProHub? We've got you!</Text>
            <Text style={styles.newcomerDesc}>
              Every new worker gets XProHub Guarantee on their first 3 jobs, reduced fees and our "Give them a chance!" feature that encourages customers to hire newcomers.
            </Text>
          </View>
        </View>

        {/* Belt Ladder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THE BELT LADDER</Text>
          <Text style={styles.sectionDesc}>Tap any belt to see its perks and rewards</Text>

          {BELTS.map((belt, index) => (
            <TouchableOpacity
              key={belt.belt}
              style={[
                styles.beltCard,
                { borderColor: belt.borderColor, backgroundColor: belt.bgColor },
                belt.current && styles.beltCardCurrent,
              ]}
              onPress={() => setExpandedBelt(expandedBelt === belt.belt ? null : belt.belt)}>

              {/* Belt Header */}
              <View style={styles.beltHeader}>
                <View style={styles.beltLeft}>
                  <Text style={styles.beltEmoji}>{belt.emoji}</Text>
                  <View style={[styles.beltColorBar, { backgroundColor: belt.color }]} />
                  <View>
                    <Text style={[styles.beltName, { color: belt.color }]}>{belt.belt}</Text>
                    <Text style={styles.beltJobs}>{belt.jobs} · {belt.xp}</Text>
                  </View>
                </View>
                <View style={styles.beltRight}>
                  {belt.current && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                  {index < BELTS.findIndex(b => b.current) && (
                    <Text style={styles.completedCheck}>✓</Text>
                  )}
                  {index > BELTS.findIndex(b => b.current) && (
                    <Text style={styles.lockedIcon}>🔒</Text>
                  )}
                  <Text style={styles.expandIcon}>
                    {expandedBelt === belt.belt ? '▲' : '▼'}
                  </Text>
                </View>
              </View>

              {/* Badge */}
              <View style={[styles.badgePill, { borderColor: belt.borderColor }]}>
                <Text style={[styles.badgePillText, { color: belt.color }]}>{belt.badge}</Text>
              </View>

              {/* Expanded Content */}
              {expandedBelt === belt.belt && (
                <View style={styles.beltExpanded}>
                  <Text style={styles.beltDescription}>{belt.description}</Text>
                  <Text style={styles.perksLabel}>PERKS & REWARDS</Text>
                  {belt.perks.map((perk, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Text style={[styles.perkDot, { color: belt.color }]}>●</Text>
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              )}

            </TouchableOpacity>
          ))}
        </View>

        {/* Give Them A Chance Section */}
        <View style={styles.giveChanceSection}>
          <Text style={styles.sectionLabel}>🌱 GIVE THEM A CHANCE</Text>
          <View style={styles.giveChanceCard}>
            <Text style={styles.giveChanceTitle}>
              How XProHub supports newcomers
            </Text>
            <View style={styles.giveChanceItems}>
              {[
                { icon: '🛡️', title: 'XProHub Guarantee', desc: 'First 3 jobs fully guaranteed — customer gets refund, worker gets half pay if anything goes wrong' },
                { icon: '💰', title: 'Lower Fees', desc: 'White Belts pay only 5% platform fee instead of 10% — making them more competitive on price' },
                { icon: '👁️', title: 'Newcomer Spotlight', desc: 'Customers see a special "Give them a chance!" section featuring verified newcomers' },
                { icon: '🤝', title: 'Mentor System', desc: 'Every new worker gets paired with an experienced Green Belt or above mentor' },
                { icon: '⚡', title: 'Fast XP Start', desc: 'Newcomers earn double XP on their first 5 jobs to help them level up faster' },
              ].map((item, i) => (
                <View key={i} style={styles.giveChanceItem}>
                  <Text style={styles.giveChanceItemIcon}>{item.icon}</Text>
                  <View style={styles.giveChanceItemText}>
                    <Text style={styles.giveChanceItemTitle}>{item.title}</Text>
                    <Text style={styles.giveChanceItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
<HomeBeacon />
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
    paddingBottom: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },
  headerIcon: { fontSize: 20 },

  // Hero
  heroSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    gap: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8E8EA',
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888890',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Current Status
  currentStatus: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76,175,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  currentStatusLeft: { flex: 1, gap: 4 },
  currentStatusLabel: { fontSize: 10, color: '#888890', fontWeight: '700', letterSpacing: 1 },
  currentStatusBelt: { fontSize: 20, fontWeight: '800' },
  currentStatusBadge: { fontSize: 12, color: '#888890' },
  currentStatusRight: { alignItems: 'flex-end', gap: 2 },
  currentStatusJobs: { fontSize: 32, fontWeight: '800', color: '#C9A84C' },
  currentStatusJobsLabel: { fontSize: 11, color: '#888890' },
  currentStatusNext: { fontSize: 10, color: '#4CAF7A', fontWeight: '600' },

  // Progress
  progressSection: { width: '100%', gap: 6 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { fontSize: 12, color: '#888890' },
  progressPercent: { fontSize: 12, color: '#4CAF7A', fontWeight: '700' },
  progressBar: {
    height: 8,
    backgroundColor: '#2E2E33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF7A',
    borderRadius: 4,
  },
  progressNote: { fontSize: 11, color: '#444450', textAlign: 'center' },

  // Newcomer Box
  newcomerBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  newcomerIcon: { fontSize: 28, marginTop: 2 },
  newcomerText: { flex: 1 },
  newcomerTitle: { fontSize: 14, fontWeight: '800', color: '#C9A84C', marginBottom: 4 },
  newcomerDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  // Section
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 6,
  },
  sectionDesc: { fontSize: 12, color: '#444450', marginBottom: 16 },

  // Belt Cards
  beltCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 10,
  },
  beltCardCurrent: {
    shadowColor: '#4CAF7A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  beltHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  beltLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  beltEmoji: { fontSize: 24 },
  beltColorBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  beltName: { fontSize: 16, fontWeight: '800' },
  beltJobs: { fontSize: 11, color: '#888890', marginTop: 2 },
  beltRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  youBadge: {
    backgroundColor: '#4CAF7A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  youBadgeText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },
  completedCheck: { fontSize: 16, color: '#4CAF7A', fontWeight: '800' },
  lockedIcon: { fontSize: 14 },
  expandIcon: { fontSize: 10, color: '#888890' },

  // Badge Pill
  badgePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgePillText: { fontSize: 12, fontWeight: '700' },

  // Expanded
  beltExpanded: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    gap: 8,
  },
  beltDescription: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  perksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  perkDot: { fontSize: 8, marginTop: 5 },
  perkText: { fontSize: 12, color: '#CCCCCC', flex: 1, lineHeight: 18 },

  // Give Them A Chance
  giveChanceSection: { paddingHorizontal: 20, paddingBottom: 20 },
  giveChanceCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  giveChanceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E8E8EA',
    textAlign: 'center',
  },
  giveChanceItems: { gap: 14 },
  giveChanceItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  giveChanceItemIcon: { fontSize: 22, marginTop: 2 },
  giveChanceItemText: { flex: 1 },
  giveChanceItemTitle: { fontSize: 13, fontWeight: '700', color: '#C9A84C', marginBottom: 3 },
  giveChanceItemDesc: { fontSize: 12, color: '#888890', lineHeight: 17 },
});