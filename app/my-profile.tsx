import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import HomeBeacon from '../components/HomeBeacon';

export default function MyProfileScreen() {
  const [isWorkerMode, setIsWorkerMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationOn, setLocationOn] = useState(true);

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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Text style={styles.avatarEditText}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Sofia Rodriguez</Text>
          <Text style={styles.username}>@sofia.xprohub</Text>
          <Text style={styles.location}>📍 Manhattan, New York</Text>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>⚡ Trusted Expert · Level 8</Text>
          </View>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpLabel}>2,450 XP</Text>
              <Text style={styles.xpNext}>Next level: 5,000 XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: '49%' }]} />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>84</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>★ 4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>99%</Text>
            <Text style={styles.statLabel}>Reliable</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>$1,240</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY BADGES</Text>
          <View style={styles.badgesGrid}>
            {[
              { icon: '★', name: 'Top Pro', color: '#C9A84C' },
              { icon: '✓', name: 'Verified', color: '#4CAF7A' },
              { icon: '🛡️', name: 'Insured', color: '#5599E0' },
              { icon: '⚡', name: 'Never Cancels', color: '#9B6EE8' },
              { icon: '🏆', name: 'Top 5%', color: '#C9A84C' },
              { icon: '💬', name: 'Fast Replies', color: '#4CAF7A' },
            ].map((badge) => (
              <View key={badge.name} style={styles.badgeCard}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY MODE</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>💼</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Worker Mode</Text>
                <Text style={styles.settingDesc}>Find and accept jobs near you</Text>
              </View>
              <Switch
                value={isWorkerMode}
                onValueChange={setIsWorkerMode}
                trackColor={{ false: '#2E2E33', true: 'rgba(201,168,76,0.4)' }}
                thumbColor={isWorkerMode ? '#C9A84C' : '#888890'}
              />
            </View>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY SKILLS</Text>
          <View style={styles.skillsGrid}>
            {['Deep Cleaning', 'Regular Cleaning', 'Move-In/Out', 'Post-Party', 'Kitchen Detail', 'Dog Walking'].map(skill => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>✓ {skill}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addSkillChip}>
              <Text style={styles.addSkillText}>+ Add Skill</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.settingCard}>

            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDesc}>Job alerts and messages</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#2E2E33', true: 'rgba(201,168,76,0.4)' }}
                thumbColor={notifications ? '#C9A84C' : '#888890'}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <Text style={styles.settingIcon}>📍</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Location</Text>
                <Text style={styles.settingDesc}>Share location for job matching</Text>
              </View>
              <Switch
                value={locationOn}
                onValueChange={setLocationOn}
                trackColor={{ false: '#2E2E33', true: 'rgba(201,168,76,0.4)' }}
                thumbColor={locationOn ? '#C9A84C' : '#888890'}
              />
            </View>

          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.settingCard}>
            {[
              { icon: '⚡', title: 'Command Center', route: '/command-center' },
              { icon: '🛡️', title: 'XProHub Protection', route: null },
              { icon: '💳', title: 'Payment Methods', route: null },
              { icon: '⭐', title: 'My Reviews', route: null },
              { icon: '❓', title: 'Help & Support', route: null },
              { icon: '📄', title: 'Terms & Privacy', route: null },
            ].map((item, index, arr) => (
              <View key={item.title}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => item.route && router.push(item.route)}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
                {index < arr.length - 1 && <View style={styles.settingDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.replace('/welcome')}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>XProHub v0.1 · Made with 💛</Text>

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
  editBtn: { color: '#C9A84C', fontSize: 15, fontWeight: '700' },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: { color: '#0E0E0F', fontSize: 32, fontWeight: '800' },
  avatarEdit: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditText: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', color: '#E8E8EA', marginBottom: 4 },
  username: { fontSize: 13, color: '#888890', marginBottom: 4 },
  location: { fontSize: 13, color: '#888890', marginBottom: 12 },
  levelBadge: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  levelText: { color: '#C9A84C', fontSize: 13, fontWeight: '700' },

  // XP Bar
  xpSection: { width: '100%', gap: 8 },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },
  xpNext: { fontSize: 12, color: '#888890' },
  xpBar: {
    height: 6,
    backgroundColor: '#2E2E33',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 10, color: '#888890', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },

  // Section
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  badgeIcon: { fontSize: 14 },
  badgeName: { fontSize: 12, fontWeight: '700' },

  // Settings
  settingCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: { fontSize: 20 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: '#E8E8EA' },
  settingDesc: { fontSize: 11, color: '#888890', marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: '#2E2E33' },

  // Skills
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skillText: { fontSize: 12, color: '#4CAF7A', fontWeight: '600' },
  addSkillChip: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addSkillText: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },

  // Menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIcon: { fontSize: 20 },
  menuTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E8E8EA' },
  menuArrow: { fontSize: 20, color: '#444450' },

  // Sign Out
  signOutBtn: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutText: { color: '#FF3B30', fontSize: 15, fontWeight: '700' },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#444450',
    marginBottom: 8,
  },
});