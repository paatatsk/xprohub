import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';
import HomeBeacon from '../components/HomeBeacon';

const TEAM_MEMBERS_CONFIRMED = [
  { avatar: 'SR', color: '#C9A84C', name: 'Sofia R.', belt: '🥋 Green' },
  { avatar: 'JL', color: '#4CAF7A', name: 'James L.', belt: '🥋 Yellow' },
  { avatar: 'AM', color: '#9B6EE8', name: 'Aisha M.', belt: '🥋 Green' },
  { avatar: 'CM', color: '#5599E0', name: 'Carlos M.', belt: '🥋 Yellow' },
  { avatar: 'TR', color: '#C9A84C', name: 'Tom R.', belt: '🥋 Orange' },
  { avatar: 'LK', color: '#4CAF7A', name: 'Lisa K.', belt: '🥋 Yellow' },
  { avatar: 'MJ', color: '#9B6EE8', name: 'Mike J.', belt: '🥋 Yellow' },
  { avatar: 'RP', color: '#5599E0', name: 'Rosa P.', belt: '🥋 Green' },
];

const REQUIREMENTS = [
  { icon: '🥋', text: 'Yellow Belt minimum (5+ jobs)' },
  { icon: '💪', text: 'Physical fitness required' },
  { icon: '🚗', text: 'Own transportation' },
  { icon: '🧤', text: 'Bring work gloves' },
  { icon: '✓', text: 'Background check passed' },
];

export default function TeamJobScreen() {
  const [applied, setApplied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmedCount = TEAM_MEMBERS_CONFIRMED.length;
  const totalNeeded = 10;
  const spotsLeft = totalNeeded - confirmedCount;
  const fillPercent = (confirmedCount / totalNeeded) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>👥 TEAM JOB</Text>
          </View>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+75 XP</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Job Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.employerRow}>
            <View style={styles.employerBadge}>
              <Text style={styles.employerIcon}>🏛️</Text>
              <Text style={styles.employerName}>NYC Parks Department</Text>
              <Text style={styles.employerVerified}>✓ Official</Text>
            </View>
            <GoldenDollar size="small" speed="slow" pulse={true} glow={true} />
          </View>

          <Text style={styles.jobTitle}>Storm Cleanup</Text>
          <Text style={styles.jobLocation}>🌳 Central Park — 72nd St Entrance</Text>

          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>Saturday March 22</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏰</Text>
              <Text style={styles.metaText}>8:00 AM — 2:00 PM</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>6 hours</Text>
            </View>
          </View>

          {/* Pay Breakdown */}
          <View style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Hourly Rate</Text>
              <Text style={styles.payValue}>$20/hr</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Duration</Text>
              <Text style={styles.payValue}>6 hours</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={styles.payTotalLabel}>Your Total Pay</Text>
              <Text style={styles.payTotalValue}>$120.00</Text>
            </View>
            <Text style={styles.payNote}>🛡️ Held in escrow · Released after completion</Text>
          </View>
        </View>

        {/* Team Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TEAM STATUS</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {confirmedCount} / {totalNeeded} workers confirmed
              </Text>
              {spotsLeft > 0 ? (
                <View style={styles.spotsLeftBadge}>
                  <Text style={styles.spotsLeftText}>⚡ {spotsLeft} spots left!</Text>
                </View>
              ) : (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullBadgeText}>✓ Team Full</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${fillPercent}%` }]} />
            </View>

            {/* Team Avatars */}
            <View style={styles.teamAvatars}>
              {TEAM_MEMBERS_CONFIRMED.map((member, i) => (
                <View key={i} style={[styles.memberAvatar, { backgroundColor: member.color }]}>
                  <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                </View>
              ))}
              {Array.from({ length: spotsLeft }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.emptySlot}>
                  <Text style={styles.emptySlotText}>?</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Confirmed Team */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONFIRMED TEAM MEMBERS</Text>
          <View style={styles.teamList}>
            {TEAM_MEMBERS_CONFIRMED.map((member, i) => (
              <View key={i} style={styles.memberCard}>
                <View style={[styles.memberCardAvatar, { backgroundColor: member.color }]}>
                  <Text style={styles.memberCardAvatarText}>{member.avatar}</Text>
                </View>
                <Text style={styles.memberCardName}>{member.name}</Text>
                <Text style={styles.memberCardBelt}>{member.belt}</Text>
                <Text style={styles.memberCardCheck}>✓</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REQUIREMENTS</Text>
          <View style={styles.requirementsCard}>
            {REQUIREMENTS.map((req, i) => (
              <View key={i} style={styles.requirementRow}>
                <Text style={styles.requirementIcon}>{req.icon}</Text>
                <Text style={styles.requirementText}>{req.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>JOB DESCRIPTION</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>
              Help clean up Central Park after the recent storm. Tasks include removing fallen branches, clearing debris from pathways, cleaning benches and restoring the park to its normal condition.
            </Text>
            <Text style={styles.descText}>
              All waste disposal equipment will be provided by NYC Parks. Workers should wear comfortable clothes suitable for outdoor physical work.
            </Text>
          </View>
        </View>

        {/* XP Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR REWARDS</Text>
          <View style={styles.rewardsCard}>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>⚡</Text>
              <Text style={styles.rewardText}>Team Job Completion</Text>
              <Text style={styles.rewardXP}>+75 XP</Text>
            </View>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>⭐</Text>
              <Text style={styles.rewardText}>Perfect Team Rating Bonus</Text>
              <Text style={styles.rewardXP}>+25 XP</Text>
            </View>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>🏛️</Text>
              <Text style={styles.rewardText}>Government Job Badge Progress</Text>
              <Text style={styles.rewardXP}>1/3</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>💰</Text>
              <Text style={styles.rewardText}>Total Pay</Text>
              <Text style={[styles.rewardXP, { color: '#4CAF7A' }]}>$120.00</Text>
            </View>
          </View>
        </View>

        {/* Group Chat Notice */}
        <View style={styles.chatNotice}>
          <Text style={styles.chatNoticeIcon}>💬</Text>
          <View style={styles.chatNoticeText}>
            <Text style={styles.chatNoticeTitle}>Team Group Chat</Text>
            <Text style={styles.chatNoticeDesc}>
              When you join the team a group chat is automatically created with all team members and the NYC Parks contact
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyBar}>
        {!applied && !showConfirm && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setShowConfirm(true)}>
            <Text style={styles.applyBtnText}>⚡ Apply for This Team Job</Text>
            <Text style={styles.applyBtnSub}>$120 · 6 hrs · {spotsLeft} spots left</Text>
          </TouchableOpacity>
        )}

        {showConfirm && !applied && (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirm your availability</Text>
            <Text style={styles.confirmDesc}>Saturday March 22 · 8:00 AM — 2:00 PM</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setShowConfirm(false)}>
                <Text style={styles.confirmNoText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setApplied(true);
                  setShowConfirm(false);
                }}>
                <Text style={styles.confirmYesText}>✓ Confirm — I'm In!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {applied && (
          <View style={styles.appliedBox}>
            <Text style={styles.appliedIcon}>🎉</Text>
            <View style={styles.appliedText}>
              <Text style={styles.appliedTitle}>You're on the team!</Text>
              <Text style={styles.appliedDesc}>Group chat will be created when team is full</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/chat')}>
              <Text style={styles.chatBtnText}>💬</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <HomeBeacon />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerCenter: { flex: 1, alignItems: 'center' },
  teamBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  teamBadgeText: { color: '#C9A84C', fontSize: 13, fontWeight: '800' },
  xpBadge: {
    backgroundColor: 'rgba(155,110,232,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(155,110,232,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  xpBadgeText: { color: '#9B6EE8', fontSize: 12, fontWeight: '800' },

  // Hero Card
  heroCard: {
    backgroundColor: '#171719',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    padding: 20,
    gap: 12,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  employerIcon: { fontSize: 14 },
  employerName: { fontSize: 12, color: '#4CAF7A', fontWeight: '700' },
  employerVerified: { fontSize: 11, color: '#4CAF7A' },
  jobTitle: { fontSize: 28, fontWeight: '800', color: '#E8E8EA' },
  jobLocation: { fontSize: 14, color: '#888890' },

  // Job Meta
  jobMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 13, color: '#CCCCCC', fontWeight: '600' },

  // Pay Card
  payCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  payRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payLabel: { fontSize: 13, color: '#888890' },
  payValue: { fontSize: 13, color: '#E8E8EA', fontWeight: '600' },
  payDivider: { height: 1, backgroundColor: 'rgba(201,168,76,0.2)' },
  payTotalLabel: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  payTotalValue: { fontSize: 20, fontWeight: '800', color: '#C9A84C' },
  payNote: { fontSize: 11, color: '#888890', textAlign: 'center', marginTop: 4 },

  // Section
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  spotsLeftBadge: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotsLeftText: { fontSize: 11, color: '#FF3B30', fontWeight: '800' },
  fullBadge: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fullBadgeText: { fontSize: 11, color: '#4CAF7A', fontWeight: '800' },
  progressBar: {
    height: 8,
    backgroundColor: '#2E2E33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 4,
  },

  // Team Avatars
  teamAvatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 11, fontWeight: '800', color: '#0E0E0F' },
  emptySlot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2E2E33',
    borderWidth: 1,
    borderColor: '#3E3E43',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: { fontSize: 14, color: '#444450' },

  // Team List
  teamList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    padding: 8,
    gap: 8,
    width: '47%',
  },
  memberCardAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCardAvatarText: { fontSize: 9, fontWeight: '800', color: '#0E0E0F' },
  memberCardName: { flex: 1, fontSize: 11, fontWeight: '700', color: '#E8E8EA' },
  memberCardBelt: { fontSize: 9, color: '#888890' },
  memberCardCheck: { fontSize: 12, color: '#4CAF7A', fontWeight: '800' },

  // Requirements
  requirementsCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementIcon: { fontSize: 18, width: 24 },
  requirementText: { fontSize: 13, color: '#CCCCCC', fontWeight: '600', flex: 1 },

  // Description
  descCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  descText: { fontSize: 13, color: '#CCCCCC', lineHeight: 20 },

  // Rewards
  rewardsCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardIcon: { fontSize: 18, width: 24 },
  rewardText: { flex: 1, fontSize: 13, color: '#CCCCCC' },
  rewardXP: { fontSize: 13, fontWeight: '800', color: '#9B6EE8' },
  rewardDivider: { height: 1, backgroundColor: '#2E2E33' },

  // Chat Notice
  chatNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(155,110,232,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(155,110,232,0.2)',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chatNoticeIcon: { fontSize: 24 },
  chatNoticeText: { flex: 1 },
  chatNoticeTitle: { fontSize: 13, fontWeight: '700', color: '#9B6EE8', marginBottom: 4 },
  chatNoticeDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  // Apply Bar
  applyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(14,14,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
  },
  applyBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  applyBtnText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  applyBtnSub: { color: 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: '600' },

  // Confirm Box
  confirmBox: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  confirmTitle: { fontSize: 15, fontWeight: '800', color: '#E8E8EA', textAlign: 'center' },
  confirmDesc: { fontSize: 13, color: '#888890', textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  confirmNo: {
    flex: 1,
    backgroundColor: '#2E2E33',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  confirmNoText: { color: '#888890', fontSize: 14, fontWeight: '700' },
  confirmYes: {
    flex: 2,
    backgroundColor: '#C9A84C',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  confirmYesText: { color: '#0E0E0F', fontSize: 14, fontWeight: '800' },

  // Applied Box
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  appliedIcon: { fontSize: 28 },
  appliedText: { flex: 1 },
  appliedTitle: { fontSize: 15, fontWeight: '800', color: '#4CAF7A' },
  appliedDesc: { fontSize: 12, color: '#888890', marginTop: 2 },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9B6EE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { fontSize: 20 },
});