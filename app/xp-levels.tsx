import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LEVELS = [
  { level: 1, name: 'Newcomer', xpRequired: 0, xpNext: 500, icon: '🌱', color: '#888890' },
  { level: 2, name: 'Helper', xpRequired: 500, xpNext: 1000, icon: '🌿', color: '#4CAF7A' },
  { level: 3, name: 'Reliable', xpRequired: 1000, xpNext: 2000, icon: '⭐', color: '#4CAF7A' },
  { level: 4, name: 'Pro', xpRequired: 2000, xpNext: 3500, icon: '🌟', color: '#5599E0' },
  { level: 5, name: 'Expert', xpRequired: 3500, xpNext: 5000, icon: '💫', color: '#5599E0' },
  { level: 6, name: 'Rising Pro', xpRequired: 5000, xpNext: 7500, icon: '🚀', color: '#9B6EE8' },
  { level: 7, name: 'Elite Pro', xpRequired: 7500, xpNext: 10000, icon: '👑', color: '#9B6EE8' },
  { level: 8, name: 'Trusted Expert', xpRequired: 10000, xpNext: 15000, icon: '⚡', color: '#C9A84C' },
  { level: 9, name: 'Master Pro', xpRequired: 15000, xpNext: 25000, icon: '🏆', color: '#C9A84C' },
  { level: 10, name: 'XPro Legend', xpRequired: 25000, xpNext: null, icon: '🌟', color: '#C9A84C' },
];

const BADGES = [
  { icon: '⚡', name: 'Never Cancels', desc: 'Complete 20 jobs without cancelling', earned: true, color: '#C9A84C' },
  { icon: '★', name: 'Top Pro', desc: 'Maintain 4.8+ rating for 30 days', earned: true, color: '#C9A84C' },
  { icon: '✓', name: 'Verified', desc: 'Complete identity verification', earned: true, color: '#4CAF7A' },
  { icon: '🛡️', name: 'Insured', desc: 'Activate XProHub Protection', earned: true, color: '#5599E0' },
  { icon: '🏆', name: 'Top 5%', desc: 'Rank in top 5% of workers in your area', earned: true, color: '#C9A84C' },
  { icon: '💬', name: 'Fast Replies', desc: 'Respond to 50 messages within 5 minutes', earned: true, color: '#4CAF7A' },
  { icon: '🌟', name: 'Rising Star', desc: 'Complete 50 jobs', earned: false, color: '#9B6EE8' },
  { icon: '💰', name: 'Money Maker', desc: 'Earn $5,000 on XProHub', earned: false, color: '#C9A84C' },
  { icon: '👥', name: 'Squad Leader', desc: 'Lead a squad of 3+ workers', earned: false, color: '#5599E0' },
];

const XP_WAYS = [
  { icon: '✓', action: 'Complete a job', xp: '+50 XP', color: '#4CAF7A' },
  { icon: '★', action: 'Receive 5-star review', xp: '+30 XP', color: '#C9A84C' },
  { icon: '⚡', action: 'Fast response (< 5 min)', xp: '+10 XP', color: '#C9A84C' },
  { icon: '📅', action: 'Complete job on time', xp: '+20 XP', color: '#4CAF7A' },
  { icon: '🔄', action: 'Repeat customer', xp: '+25 XP', color: '#9B6EE8' },
  { icon: '📝', action: 'Leave a review', xp: '+50 XP', color: '#5599E0' },
  { icon: '👥', action: 'Refer a worker', xp: '+100 XP', color: '#C9A84C' },
];

const CURRENT_XP = 2450;
const CURRENT_LEVEL = LEVELS[7]; // Level 8

export default function XPLevelsScreen() {
  const xpProgress = (CURRENT_XP / CURRENT_LEVEL.xpNext) * 100;

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
        <Text style={styles.headerTitle}>XP & Levels</Text>
        <Text style={styles.headerIcon}>⚡</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Current Level Card */}
        <View style={styles.currentLevelCard}>
          <Text style={styles.currentLevelIcon}>{CURRENT_LEVEL.icon}</Text>
          <Text style={styles.currentLevelName}>{CURRENT_LEVEL.name}</Text>
          <Text style={styles.currentLevelNum}>Level {CURRENT_LEVEL.level}</Text>

          {/* XP Bar */}
          <View style={styles.xpBarSection}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpCurrent}>{CURRENT_XP.toLocaleString()} XP</Text>
              <Text style={styles.xpNext}>{CURRENT_LEVEL.xpNext?.toLocaleString()} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
            </View>
            <Text style={styles.xpRemaining}>
              {(CURRENT_LEVEL.xpNext - CURRENT_XP).toLocaleString()} XP to next level
            </Text>
          </View>
        </View>

        {/* How to Earn XP */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW TO EARN XP</Text>
          <View style={styles.xpWaysCard}>
            {XP_WAYS.map((way, i) => (
              <View key={i}>
                <View style={styles.xpWayRow}>
                  <View style={[styles.xpWayIcon, { backgroundColor: `${way.color}15` }]}>
                    <Text style={styles.xpWayIconText}>{way.icon}</Text>
                  </View>
                  <Text style={styles.xpWayAction}>{way.action}</Text>
                  <Text style={[styles.xpWayPoints, { color: way.color }]}>{way.xp}</Text>
                </View>
                {i < XP_WAYS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Level Ladder */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LEVEL LADDER</Text>
          {LEVELS.map((lvl) => {
            const isCurrent = lvl.level === CURRENT_LEVEL.level;
            const isCompleted = lvl.level < CURRENT_LEVEL.level;
            return (
              <View
                key={lvl.level}
                style={[
                  styles.levelRow,
                  isCurrent && styles.levelRowCurrent,
                ]}>
                <View style={[styles.levelIconBox, { backgroundColor: `${lvl.color}15` }]}>
                  <Text style={styles.levelIconText}>{lvl.icon}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={[styles.levelName, isCurrent && styles.levelNameCurrent]}>
                    Level {lvl.level} · {lvl.name}
                  </Text>
                  <Text style={styles.levelXP}>
                    {lvl.xpRequired.toLocaleString()} XP
                    {lvl.xpNext ? ` — ${lvl.xpNext.toLocaleString()} XP` : '+'}
                  </Text>
                </View>
                <View style={styles.levelStatus}>
                  {isCompleted && <Text style={styles.levelDone}>✓</Text>}
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>YOU</Text>
                    </View>
                  )}
                  {!isCompleted && !isCurrent && (
                    <Text style={styles.levelLocked}>🔒</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => (
              <View
                key={badge.name}
                style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                <Text style={[styles.badgeIcon, !badge.earned && styles.badgeIconLocked]}>
                  {badge.earned ? badge.icon : '🔒'}
                </Text>
                <Text style={[styles.badgeName, { color: badge.earned ? badge.color : '#444450' }]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {badge.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },
  headerIcon: { fontSize: 20 },

  // Current Level Card
  currentLevelCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  currentLevelIcon: { fontSize: 56, marginBottom: 8 },
  currentLevelName: { fontSize: 24, fontWeight: '800', color: '#C9A84C', marginBottom: 4 },
  currentLevelNum: { fontSize: 14, color: '#888890', marginBottom: 20 },

  // XP Bar
  xpBarSection: { width: '100%', gap: 8 },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpCurrent: { fontSize: 13, color: '#C9A84C', fontWeight: '700' },
  xpNext: { fontSize: 13, color: '#888890' },
  xpBar: {
    height: 8,
    backgroundColor: '#2E2E33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 4,
  },
  xpRemaining: { fontSize: 12, color: '#888890', textAlign: 'center' },

  // Section
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 14,
  },

  // XP Ways
  xpWaysCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    overflow: 'hidden',
  },
  xpWayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  xpWayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpWayIconText: { fontSize: 16 },
  xpWayAction: { flex: 1, fontSize: 13, color: '#E8E8EA', fontWeight: '600' },
  xpWayPoints: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#2E2E33' },

  // Level Ladder
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  levelRowCurrent: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  levelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIconText: { fontSize: 18 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 13, fontWeight: '700', color: '#888890' },
  levelNameCurrent: { color: '#C9A84C' },
  levelXP: { fontSize: 11, color: '#444450', marginTop: 2 },
  levelStatus: { alignItems: 'center' },
  levelDone: { fontSize: 16, color: '#4CAF7A', fontWeight: '800' },
  currentBadge: {
    backgroundColor: '#C9A84C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },
  levelLocked: { fontSize: 14 },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '30%',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIcon: { fontSize: 24 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { fontSize: 9, color: '#444450', textAlign: 'center', lineHeight: 13 },
});