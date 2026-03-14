import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { icon: '🧹', name: 'Cleaning', jobs: 24, color: '#C9A84C' },
  { icon: '🔧', name: 'Repairs', jobs: 18, color: '#5599E0' },
  { icon: '🛒', name: 'Errands', jobs: 31, color: '#4CAF7A' },
  { icon: '🐾', name: 'Pet Care', jobs: 12, color: '#C9A84C' },
  { icon: '👶', name: 'Child Care', jobs: 8, color: '#9B6EE8' },
  { icon: '💪', name: 'Sports', jobs: 15, color: '#5599E0' },
  { icon: '🍽️', name: 'Catering', jobs: 9, color: '#4CAF7A' },
  { icon: '🎉', name: 'Events', jobs: 7, color: '#C9A84C' },
  { icon: '⚡', name: 'Electrical', jobs: 11, color: '#9B6EE8' },
  { icon: '🚿', name: 'Plumbing', jobs: 6, color: '#5599E0' },
  { icon: '🎨', name: 'Painting', jobs: 9, color: '#C9A84C' },
  { icon: '💻', name: 'IT Support', jobs: 14, color: '#4CAF7A' },
];

const TOP_WORKERS = [
  { name: 'Sofia R.', role: 'Cleaning', rating: 4.9, jobs: 84, avatar: 'SR', color: '#C9A84C', level: '⚡ Trusted Expert' },
  { name: 'James L.', role: 'Repairs', rating: 4.8, jobs: 48, avatar: 'JL', color: '#4CAF7A', level: '🌟 Rising Pro' },
  { name: 'Aisha M.', role: 'Cleaning', rating: 4.9, jobs: 62, avatar: 'AM', color: '#9B6EE8', level: '⭐ Elite Pro' },
  { name: 'Carlos M.', role: 'Errands', rating: 4.7, jobs: 31, avatar: 'CM', color: '#5599E0', level: '🌟 Rising Pro' },
];

const NEARBY_JOBS = [
  { icon: '🧹', title: 'Deep Cleaning', budget: '$75', distance: '0.2 mi', urgent: true, time: 'ASAP' },
  { icon: '🔧', title: 'Furniture Assembly', budget: '$50', distance: '0.5 mi', urgent: false, time: 'Today' },
  { icon: '🛒', title: 'Grocery Delivery', budget: '$25', distance: '0.3 mi', urgent: true, time: 'ASAP' },
  { icon: '🐾', title: 'Dog Walking', budget: '$20', distance: '0.8 mi', urgent: false, time: 'Tomorrow' },
  { icon: '💻', title: 'WiFi Setup', budget: '$45', distance: '1.1 mi', urgent: false, time: 'Today' },
];

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

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
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity>
          <Text style={styles.filterBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, workers, skills..."
          placeholderTextColor="#444450"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['discover', 'jobs', 'workers'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'discover' ? '✨ Discover' : tab === 'jobs' ? '💼 Jobs' : '👷 Workers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <View>
            {/* Location Banner */}
            <View style={styles.locationBanner}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>Showing results near <Text style={styles.locationHighlight}>Manhattan, NY</Text></Text>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BROWSE CATEGORIES</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={styles.categoryCard}
                    onPress={() => router.push('/post-job')}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryJobs}>{cat.jobs} jobs</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Top Workers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>TOP WORKERS NEARBY</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workersScroll}>
                {TOP_WORKERS.map((worker) => (
                  <TouchableOpacity
                    key={worker.name}
                    style={styles.workerCard}
                    onPress={() => router.push('/worker-profile')}>
                    <View style={[styles.workerAvatar, { backgroundColor: worker.color }]}>
                      <Text style={styles.workerAvatarText}>{worker.avatar}</Text>
                    </View>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerRole}>{worker.role}</Text>
                    <Text style={styles.workerRating}>★ {worker.rating}</Text>
                    <View style={styles.workerLevel}>
                      <Text style={styles.workerLevelText}>{worker.level}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Nearby Jobs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>JOBS NEAR YOU</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {NEARBY_JOBS.map((job, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.jobCard}
                  onPress={() => router.push('/worker-match')}>
                  <Text style={styles.jobIcon}>{job.icon}</Text>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobMeta}>📍 {job.distance} · ⏰ {job.time}</Text>
                  </View>
                  <View style={styles.jobRight}>
                    <Text style={styles.jobBudget}>{job.budget}</Text>
                    {job.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>ASAP</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ALL NEARBY JOBS</Text>
            {NEARBY_JOBS.map((job, i) => (
              <TouchableOpacity
                key={i}
                style={styles.jobCard}
                onPress={() => router.push('/worker-match')}>
                <Text style={styles.jobIcon}>{job.icon}</Text>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobMeta}>📍 {job.distance} · ⏰ {job.time}</Text>
                </View>
                <View style={styles.jobRight}>
                  <Text style={styles.jobBudget}>{job.budget}</Text>
                  {job.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>ASAP</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* WORKERS TAB */}
        {activeTab === 'workers' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TOP WORKERS NEARBY</Text>
            {TOP_WORKERS.map((worker) => (
              <TouchableOpacity
                key={worker.name}
                style={styles.workerListCard}
                onPress={() => router.push('/worker-profile')}>
                <View style={[styles.workerAvatar, { backgroundColor: worker.color }]}>
                  <Text style={styles.workerAvatarText}>{worker.avatar}</Text>
                </View>
                <View style={styles.workerListInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>{worker.role} · {worker.jobs} jobs</Text>
                  <Text style={styles.workerLevelText}>{worker.level}</Text>
                </View>
                <Text style={styles.workerRating}>★ {worker.rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  filterBtn: { fontSize: 20 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#E8E8EA',
    paddingVertical: 12,
  },
  clearBtn: { fontSize: 14, color: '#888890' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  tab: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.3)',
  },
  tabText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  tabTextActive: { color: '#C9A84C' },

  // Location Banner
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: 13, color: '#888890' },
  locationHighlight: { color: '#C9A84C', fontWeight: '700' },

  // Section
  section: { padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAll: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 12, fontWeight: '700', color: '#E8E8EA', textAlign: 'center' },
  categoryJobs: { fontSize: 10, color: '#888890' },

  // Workers Scroll
  workersScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  workerCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginRight: 10,
    width: 110,
    gap: 6,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: { color: '#0E0E0F', fontSize: 14, fontWeight: '800' },
  workerName: { fontSize: 13, fontWeight: '700', color: '#E8E8EA' },
  workerRole: { fontSize: 11, color: '#888890' },
  workerRating: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },
  workerLevel: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  workerLevelText: { fontSize: 9, color: '#C9A84C', fontWeight: '600' },

  // Job Cards
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  jobIcon: { fontSize: 24 },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: '#E8E8EA' },
  jobMeta: { fontSize: 11, color: '#888890', marginTop: 3 },
  jobRight: { alignItems: 'flex-end', gap: 4 },
  jobBudget: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  urgentBadge: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentText: { fontSize: 9, color: '#FF3B30', fontWeight: '800' },

  // Worker List Cards
  workerListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  workerListInfo: { flex: 1, gap: 3 },
});