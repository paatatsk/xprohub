import HomeBeacon from '@/components/HomeBeacon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GoldenDollar from '../components/GoldenDollar';

const INITIAL_JOBS = [
  {
    id: 1,
    icon: '🧹',
    title: 'Deep Cleaning',
    budget: 75,
    distance: 0.2,
    time: 'ASAP',
    category: 'Cleaning',
    watchers: 2,
    postedAgo: 'Just now',
    urgent: true,
    status: 'live',
  },
  {
    id: 2,
    icon: '🔧',
    title: 'Furniture Assembly',
    budget: 50,
    distance: 0.5,
    time: 'Today',
    category: 'Repairs',
    watchers: 1,
    postedAgo: '2 min ago',
    urgent: false,
    status: 'live',
  },
  {
    id: 3,
    icon: '🛒',
    title: 'Grocery Delivery',
    budget: 25,
    distance: 0.3,
    time: 'ASAP',
    category: 'Errands',
    watchers: 3,
    postedAgo: '3 min ago',
    urgent: true,
    status: 'live',
  },
  {
    id: 4,
    icon: '🐾',
    title: 'Dog Walking',
    budget: 20,
    distance: 0.8,
    time: 'Today',
    category: 'Pet Care',
    watchers: 0,
    postedAgo: '5 min ago',
    urgent: false,
    status: 'live',
  },
  {
    id: 5,
    icon: '💻',
    title: 'WiFi Setup',
    budget: 45,
    distance: 1.1,
    time: 'Today',
    category: 'IT Help',
    watchers: 1,
    postedAgo: '7 min ago',
    urgent: false,
    status: 'live',
  },
  {
    id: 6,
    icon: '🎨',
    title: 'Room Painting',
    budget: 120,
    distance: 0.9,
    time: 'Tomorrow',
    category: 'Painting',
    watchers: 2,
    postedAgo: '10 min ago',
    urgent: false,
    status: 'live',
  },
];

const NEW_JOBS = [
  {
    id: 7,
    icon: '🍽️',
    title: 'Private Chef — Dinner',
    budget: 150,
    distance: 0.4,
    time: 'Tonight',
    category: 'Catering',
    watchers: 0,
    postedAgo: 'Just now',
    urgent: true,
    status: 'live',
  },
  {
    id: 8,
    icon: '💪',
    title: 'Personal Training',
    budget: 60,
    distance: 0.6,
    time: 'Tomorrow',
    category: 'Sports',
    watchers: 0,
    postedAgo: 'Just now',
    urgent: false,
    status: 'live',
  },
  {
    id: 9,
    icon: '🧹',
    title: 'Office Cleaning',
    budget: 90,
    distance: 0.7,
    time: 'ASAP',
    category: 'Cleaning',
    watchers: 0,
    postedAgo: 'Just now',
    urgent: true,
    status: 'live',
  },
];

const FILTERS = ['All', 'Cleaning', 'Repairs', 'Errands', 'Pet Care', 'IT Help', 'Catering', 'Sports'];

export default function LiveMarketScreen() {
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [newJobIndex, setNewJobIndex] = useState(0);
  const [totalPosted, setTotalPosted] = useState(6);
  const [isLive, setIsLive] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const newJobAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for LIVE indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Simulate live job updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Randomly take a job
      setJobs(prev => {
        const liveJobs = prev.filter(j => j.status === 'live');
        if (liveJobs.length === 0) return prev;
        const randomIndex = Math.floor(Math.random() * liveJobs.length);
        const takenJobId = liveJobs[randomIndex].id;
        return prev.map(j => j.id === takenJobId ? { ...j, status: 'taken' } : j);
      });

      // Remove taken jobs after 2 seconds
      setTimeout(() => {
        setJobs(prev => prev.filter(j => j.status !== 'taken'));
      }, 2000);

      // Add a new job
      setTimeout(() => {
        if (newJobIndex < NEW_JOBS.length) {
          setJobs(prev => [NEW_JOBS[newJobIndex], ...prev]);
          setNewJobIndex(i => i + 1);
          setTotalPosted(n => n + 1);
        }
      }, 3000);

    }, 6000);

    return () => clearInterval(interval);
  }, [isLive, newJobIndex]);

  const handleApply = (jobId) => {
    if (appliedJobs.includes(jobId)) return;
    setAppliedJobs(prev => [...prev, jobId]);
    setJobs(prev => prev.map(j =>
      j.id === jobId ? { ...j, watchers: j.watchers + 1 } : j
    ));
  };

  const filteredJobs = jobs.filter(j =>
    activeFilter === 'All' || j.category === activeFilter
  );

  const liveCount = jobs.filter(j => j.status === 'live').length;

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
        <View style={styles.headerCenter}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.headerTitle}>Live Market</Text>
        </View>
        <TouchableOpacity
          style={[styles.pauseBtn, !isLive && styles.pauseBtnActive]}
          onPress={() => setIsLive(!isLive)}>
          <Text style={styles.pauseBtnText}>{isLive ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{liveCount}</Text>
          <Text style={styles.statLabel}>Live Jobs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalPosted}</Text>
          <Text style={styles.statLabel}>Posted Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{appliedJobs.length}</Text>
          <Text style={styles.statLabel}>Applied</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <GoldenDollar size="small" speed="normal" pulse={true} glow={false} />
        </View>
      </View>

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Live Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.feed}
        contentContainerStyle={styles.feedContent}>

        {filteredJobs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👀</Text>
            <Text style={styles.emptyTitle}>Watching for jobs...</Text>
            <Text style={styles.emptyDesc}>New jobs will appear here in real time</Text>
          </View>
        )}

        {filteredJobs.map((job) => (
          <Animated.View
            key={job.id}
            style={[
              styles.jobCard,
              job.status === 'taken' && styles.jobCardTaken,
              job.postedAgo === 'Just now' && styles.jobCardNew,
            ]}>

            {/* New / Taken Badge */}
            {job.postedAgo === 'Just now' && job.status === 'live' && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>⚡ NEW</Text>
              </View>
            )}
            {job.status === 'taken' && (
              <View style={styles.takenBadge}>
                <Text style={styles.takenBadgeText}>✓ TAKEN</Text>
              </View>
            )}

            {/* Job Info */}
            <View style={styles.jobTop}>
              <Text style={styles.jobIcon}>{job.icon}</Text>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, job.status === 'taken' && styles.jobTitleTaken]}>
                  {job.title}
                </Text>
                <Text style={styles.jobMeta}>
                  📍 {job.distance} mi · ⏰ {job.time} · 🕐 {job.postedAgo}
                </Text>
                {job.watchers > 0 && (
                  <Text style={styles.jobWatchers}>
                    👁️ {job.watchers} worker{job.watchers > 1 ? 's' : ''} looking
                  </Text>
                )}
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobBudget}>${job.budget}</Text>
                {job.urgent && job.status === 'live' && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>ASAP</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Apply Button */}
            {job.status === 'live' && (
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  appliedJobs.includes(job.id) && styles.applyBtnApplied,
                ]}
                onPress={() => handleApply(job.id)}>
                <Text style={[
                  styles.applyBtnText,
                  appliedJobs.includes(job.id) && styles.applyBtnTextApplied,
                ]}>
                  {appliedJobs.includes(job.id) ? '✓ Applied — Waiting for response' : '⚡ Apply Now'}
                </Text>
              </TouchableOpacity>
            )}

          </Animated.View>
        ))}

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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },
  pauseBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pauseBtnActive: {
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  pauseBtnText: { fontSize: 14 },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2E2E33',
    paddingVertical: 10,
    marginBottom: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 9, color: '#888890' },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },

  // Filter
  filterBar: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  filterText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  filterTextActive: { color: '#C9A84C' },

  // Feed
  feed: { flex: 1 },
  feedContent: { paddingHorizontal: 16 },

  // Job Cards
  jobCard: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    position: 'relative',
  },
  jobCardNew: {
    borderColor: 'rgba(201,168,76,0.5)',
    backgroundColor: 'rgba(201,168,76,0.04)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  jobCardTaken: {
    opacity: 0.4,
    borderColor: '#2E2E33',
  },

  // New / Taken Badges
  newBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#C9A84C',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  newBadgeText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },
  takenBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#4CAF7A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  takenBadgeText: { fontSize: 10, color: '#0E0E0F', fontWeight: '800' },

  // Job Info
  jobTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  jobIcon: { fontSize: 28 },
  jobInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  jobTitleTaken: { color: '#444450', textDecorationLine: 'line-through' },
  jobMeta: { fontSize: 11, color: '#888890' },
  jobWatchers: { fontSize: 11, color: '#C9A84C', fontWeight: '600' },
  jobRight: { alignItems: 'flex-end', gap: 4 },
  jobBudget: { fontSize: 20, fontWeight: '800', color: '#C9A84C' },
  urgentBadge: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentText: { fontSize: 9, color: '#FF3B30', fontWeight: '800' },

  // Apply Button
  applyBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnApplied: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    shadowOpacity: 0,
  },
  applyBtnText: { fontSize: 14, fontWeight: '800', color: '#0E0E0F' },
  applyBtnTextApplied: { color: '#4CAF7A' },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#E8E8EA' },
  emptyDesc: { fontSize: 14, color: '#888890' },
});