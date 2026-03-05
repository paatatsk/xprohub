import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WORKER = {
  name: 'Sofia Rodriguez',
  role: 'Home Cleaning Specialist',
  rating: 4.9,
  reviews: 84,
  price: 25,
  distance: 0.2,
  level: '⚡ Trusted Expert',
  reliability: 99,
  jobsDone: 84,
  memberSince: 'March 2024',
  avatar: 'SR',
  color: '#C9A84C',
  bio: 'Professional cleaner with 3 years experience. I take pride in every job and treat your home like my own. Eco-friendly products available on request.',
  badges: ['★ Top Pro', '✓ Verified', '🛡 Insured', '⚡ Never Cancels'],
  skills: ['Deep Cleaning', 'Regular Cleaning', 'Move-In/Out', 'Post-Party', 'Kitchen Detail', 'Bathroom Detail'],
  languages: ['English', 'Spanish'],
  reviews: [
    { name: 'Michael T.', rating: 5, date: '2 days ago', text: 'Sofia was amazing! My apartment has never been cleaner. Very professional and thorough.' },
    { name: 'Jennifer K.', rating: 5, date: '1 week ago', text: 'Incredible attention to detail. Will definitely hire again!' },
    { name: 'David L.', rating: 5, date: '2 weeks ago', text: 'On time, efficient and did a fantastic job. Highly recommended.' },
  ],
};

export default function WorkerProfileScreen() {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <TouchableOpacity>
          <Text style={styles.shareBtn}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: WORKER.color }]}>
            <Text style={styles.avatarText}>{WORKER.avatar}</Text>
          </View>
          <Text style={styles.name}>{WORKER.name}</Text>
          <Text style={styles.role}>{WORKER.role}</Text>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{WORKER.level}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>★ {WORKER.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{WORKER.jobsDone}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{WORKER.reliability}%</Text>
              <Text style={styles.statLabel}>Reliable</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>${WORKER.price}</Text>
              <Text style={styles.statLabel}>Per Hour</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {WORKER.badges.map(b => (
              <View key={b} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['about', 'skills', 'reviews'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About Tab */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.bio}>{WORKER.bio}</Text>

            <Text style={styles.sectionLabel}>DETAILS</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{WORKER.distance} miles away</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>{WORKER.memberSince}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🌍</Text>
                <Text style={styles.detailLabel}>Languages</Text>
                <Text style={styles.detailValue}>{WORKER.languages.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🛡️</Text>
                <Text style={styles.detailLabel}>Insurance</Text>
                <Text style={styles.detailValue}>XProHub Protected</Text>
              </View>
            </View>
          </View>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>VERIFIED SKILLS</Text>
            <View style={styles.skillsGrid}>
              {WORKER.skills.map(skill => (
                <View key={skill} style={styles.skillTile}>
                  <Text style={styles.skillCheck}>✓</Text>
                  <Text style={styles.skillName}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>CUSTOMER REVIEWS</Text>
            {WORKER.reviews.map((review, i) => (
              <View key={i} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.name[0]}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.name}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <Text style={styles.reviewStars}>★★★★★</Text>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>💬 Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.hireButton}
          onPress={() => router.push('/job-posted')}>
          <Text style={styles.hireButtonText}>Hire Sofia — $25/hr</Text>
        </TouchableOpacity>
      </View>

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
  headerTitle: { color: '#E8E8EA', fontSize: 17, fontWeight: '700' },
  shareBtn: { color: '#888890', fontSize: 22 },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: { color: '#0E0E0F', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#E8E8EA', marginBottom: 4 },
  role: { fontSize: 14, color: '#888890', marginBottom: 12 },
  levelBadge: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  levelText: { color: '#C9A84C', fontSize: 13, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 10, color: '#888890', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 12, color: '#4CAF7A', fontWeight: '700' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  tabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.3)',
  },
  tabText: { fontSize: 13, color: '#888890', fontWeight: '600' },
  tabTextActive: { color: '#C9A84C' },

  // Tab Content
  tabContent: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },
  bio: { fontSize: 14, color: '#CCCCCC', lineHeight: 22, marginBottom: 24 },

  // Details
  detailsCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    gap: 12,
  },
  detailIcon: { fontSize: 16 },
  detailLabel: { flex: 1, fontSize: 13, color: '#888890' },
  detailValue: { fontSize: 13, color: '#E8E8EA', fontWeight: '600' },

  // Skills
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTile: {
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
  skillCheck: { fontSize: 12, color: '#4CAF7A', fontWeight: '800' },
  skillName: { fontSize: 13, color: '#E8E8EA', fontWeight: '600' },

  // Reviews
  reviewCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  reviewInfo: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  reviewDate: { fontSize: 11, color: '#888890' },
  reviewStars: { fontSize: 12, color: '#C9A84C' },
  reviewText: { fontSize: 13, color: '#CCCCCC', lineHeight: 20 },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(14,14,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  messageButtonText: { color: '#E8E8EA', fontSize: 14, fontWeight: '700' },
  hireButton: {
    flex: 2,
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  hireButtonText: { color: '#0E0E0F', fontSize: 15, fontWeight: '800' },
});