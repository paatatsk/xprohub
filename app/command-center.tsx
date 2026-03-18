import HomeBeacon from '@/components/HomeBeacon';
import { router } from 'expo-router';

import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SCHEDULE = [
  {
    id: 1,
    time: '9:00 AM',
    duration: '3 hrs',
    title: 'Deep Cleaning',
    customer: 'Michael T.',
    address: '123 West 72nd St, Manhattan',
    pay: '$75',
    status: 'confirmed',
  },
  {
    id: 2,
    time: '1:00 PM',
    duration: '2 hrs',
    title: 'Regular Cleaning',
    customer: 'Jennifer K.',
    address: '456 Park Ave, Manhattan',
    pay: '$50',
    status: 'confirmed',
  },
  {
    id: 3,
    time: '4:30 PM',
    duration: '1 hr',
    title: 'Dog Walking',
    customer: 'David L.',
    address: '789 Broadway, Manhattan',
    pay: '$25',
    status: 'pending',
  },
];

const TIMELINE = [
  {
    id: 1,
    date: 'Today',
    title: 'Deep Cleaning',
    customer: 'Michael T.',
    pay: '$75',
    status: 'upcoming',
    rating: null,
  },
  {
    id: 2,
    date: 'Yesterday',
    title: 'Move-In Cleaning',
    customer: 'Sarah M.',
    pay: '$120',
    status: 'completed',
    rating: 5,
  },
  {
    id: 3,
    date: 'Mar 8',
    title: 'Regular Cleaning',
    customer: 'Tom B.',
    pay: '$50',
    status: 'completed',
    rating: 5,
  },
  {
    id: 4,
    date: 'Mar 7',
    title: 'Post-Party Cleaning',
    customer: 'Lisa R.',
    pay: '$90',
    status: 'completed',
    rating: 4,
  },
  {
    id: 5,
    date: 'Mar 6',
    title: 'Deep Cleaning',
    customer: 'James W.',
    pay: '$75',
    status: 'completed',
    rating: 5,
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CommandCenterScreen() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDay, setSelectedDay] = useState('Thu');

  const totalEarnings = 1240;
  const thisWeek = 240;
  const thisMonth = 680;
  const jobsDone = 84;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Command Center</Text>
        <Text style={styles.headerIcon}>⚡</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['schedule', 'timeline', 'bookkeeping'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={styles.tabIcon}>
              {tab === 'schedule' ? '📅' : tab === 'timeline' ? '📋' : '💰'}
            </Text>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Week Calendar */}
          <View style={styles.calendar}>
            <Text style={styles.calendarMonth}>March 2026</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayBtn, selectedDay === day && styles.dayBtnActive]}
                  onPress={() => setSelectedDay(day)}>
                  <Text style={[styles.dayName, selectedDay === day && styles.dayNameActive]}>
                    {day}
                  </Text>
                  <Text style={[styles.dayNum, selectedDay === day && styles.dayNumActive]}>
                    {i + 3}
                  </Text>
                  {i < 3 && <View style={styles.dayDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Summary */}
          <View style={styles.daySummary}>
            <Text style={styles.daySummaryTitle}>Thursday · 3 jobs · $150 expected</Text>
          </View>

          {/* Jobs List */}
          <View style={styles.scheduleList}>
            {SCHEDULE.map((job) => (
              <View key={job.id} style={styles.scheduleCard}>
                <View style={styles.timeBlock}>
                  <Text style={styles.jobTime}>{job.time}</Text>
                  <Text style={styles.jobDuration}>{job.duration}</Text>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: job.status === 'confirmed' ? '#4CAF7A' : '#C9A84C' }
                  ]} />
                </View>
                <View style={styles.scheduleLine} />
                <View style={styles.jobDetails}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobCustomer}>👤 {job.customer}</Text>
                  <Text style={styles.jobAddress}>📍 {job.address}</Text>
                  <View style={styles.jobBottom}>
                    <Text style={styles.jobPay}>{job.pay}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: job.status === 'confirmed' ? 'rgba(76,175,122,0.1)' : 'rgba(201,168,76,0.1)' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: job.status === 'confirmed' ? '#4CAF7A' : '#C9A84C' }
                      ]}>
                        {job.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.timelineScroll}>
          <Text style={styles.sectionLabel}>JOB HISTORY</Text>
          {TIMELINE.map((job) => (
            <View key={job.id} style={styles.timelineCard}>
              <View style={styles.timelineDot}>
                <Text style={styles.timelineDotText}>
                  {job.status === 'completed' ? '✓' : '→'}
                </Text>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTop}>
                  <Text style={styles.timelineTitle}>{job.title}</Text>
                  <Text style={styles.timelinePay}>{job.pay}</Text>
                </View>
                <Text style={styles.timelineCustomer}>👤 {job.customer}</Text>
                <View style={styles.timelineBottom}>
                  <Text style={styles.timelineDate}>{job.date}</Text>
                  {job.rating && (
                    <Text style={styles.timelineRating}>
                      {'★'.repeat(job.rating)}{'☆'.repeat(5 - job.rating)}
                    </Text>
                  )}
                  <View style={[
                    styles.timelineStatus,
                    { backgroundColor: job.status === 'completed' ? 'rgba(76,175,122,0.1)' : 'rgba(201,168,76,0.1)' }
                  ]}>
                    <Text style={[
                      styles.timelineStatusText,
                      { color: job.status === 'completed' ? '#4CAF7A' : '#C9A84C' }
                    ]}>
                      {job.status === 'completed' ? '✓ Completed' : '→ Upcoming'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* BOOKKEEPING TAB */}
      {activeTab === 'bookkeeping' && (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Earnings Cards */}
          <View style={styles.earningsGrid}>
            <View style={styles.earningsCardLarge}>
              <Text style={styles.earningsLabel}>Total Earned</Text>
              <Text style={styles.earningsAmountLarge}>${totalEarnings.toLocaleString()}</Text>
              <Text style={styles.earningsSubLabel}>Since joining XProHub</Text>
            </View>
            <View style={styles.earningsRow}>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>This Week</Text>
                <Text style={styles.earningsAmount}>${thisWeek}</Text>
              </View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>This Month</Text>
                <Text style={styles.earningsAmount}>${thisMonth}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionLabel}>YOUR STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>✓</Text>
                <Text style={styles.statValue}>{jobsDone}</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={styles.statValue}>99%</Text>
                <Text style={styles.statLabel}>Reliable</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={styles.statValue}>Top 5%</Text>
                <Text style={styles.statLabel}>In Area</Text>
              </View>
            </View>
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionLabel}>THIS WEEK</Text>
            <View style={styles.chart}>
              {[
                { day: 'Mon', amount: 75, height: 50 },
                { day: 'Tue', amount: 0, height: 0 },
                { day: 'Wed', amount: 50, height: 33 },
                { day: 'Thu', amount: 150, height: 100 },
                { day: 'Fri', amount: 0, height: 0 },
                { day: 'Sat', amount: 0, height: 0 },
                { day: 'Sun', amount: 0, height: 0 },
              ].map((bar) => (
                <View key={bar.day} style={styles.chartBar}>
                  <View style={styles.chartBarTrack}>
                    <View style={[styles.chartBarFill, { height: `${bar.height}%` }]} />
                  </View>
                  <Text style={styles.chartDay}>{bar.day}</Text>
                  {bar.amount > 0 && (
                    <Text style={styles.chartAmount}>${bar.amount}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Tax Export */}
          <View style={styles.taxSection}>
            <Text style={styles.sectionLabel}>TAX & EXPORT</Text>
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportIcon}>📄</Text>
              <View style={styles.exportText}>
                <Text style={styles.exportTitle}>Export Earnings Report</Text>
                <Text style={styles.exportDesc}>Download PDF for tax filing</Text>
              </View>
              <Text style={styles.exportArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Text style={styles.exportIcon}>📊</Text>
              <View style={styles.exportText}>
                <Text style={styles.exportTitle}>Export as CSV</Text>
                <Text style={styles.exportDesc}>For spreadsheet analysis</Text>
              </View>
              <Text style={styles.exportArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.3)',
  },
  tabIcon: { fontSize: 14 },
  tabText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  tabTextActive: { color: '#C9A84C' },

  // Calendar
  calendar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  calendarMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E8E8EA',
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingVertical: 8,
    gap: 4,
  },
  dayBtnActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  dayName: { fontSize: 10, color: '#888890', fontWeight: '600' },
  dayNameActive: { color: '#C9A84C' },
  dayNum: { fontSize: 14, fontWeight: '800', color: '#888890' },
  dayNumActive: { color: '#C9A84C' },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF7A',
  },

  // Day Summary
  daySummary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(201,168,76,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  daySummaryTitle: { fontSize: 13, color: '#C9A84C', fontWeight: '600' },

  // Schedule
  scheduleList: { padding: 16, gap: 16 },
  scheduleCard: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBlock: {
    alignItems: 'center',
    width: 60,
    gap: 4,
  },
  jobTime: { fontSize: 12, fontWeight: '700', color: '#E8E8EA' },
  jobDuration: { fontSize: 10, color: '#888890' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  scheduleLine: {
    width: 1,
    backgroundColor: '#2E2E33',
    marginTop: 4,
  },
  jobDetails: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  jobTitle: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  jobCustomer: { fontSize: 12, color: '#888890' },
  jobAddress: { fontSize: 11, color: '#444450' },
  jobBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  jobPay: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Timeline
  timelineScroll: { padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 16,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  timelineCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 4,
  },
  timelineDotText: { fontSize: 12, color: '#C9A84C', fontWeight: '800' },
  timelineContent: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  timelinePay: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  timelineCustomer: { fontSize: 12, color: '#888890' },
  timelineBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineDate: { fontSize: 11, color: '#444450' },
  timelineRating: { fontSize: 11, color: '#C9A84C' },
  timelineStatus: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timelineStatusText: { fontSize: 10, fontWeight: '700' },

  // Bookkeeping
  earningsGrid: { padding: 16, gap: 10 },
  earningsCardLarge: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  earningsLabel: { fontSize: 11, color: '#888890', fontWeight: '600', letterSpacing: 1 },
  earningsAmountLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: '#C9A84C',
    marginVertical: 4,
  },
  earningsSubLabel: { fontSize: 11, color: '#444450' },
  earningsRow: { flexDirection: 'row', gap: 10 },
  earningsCard: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  earningsAmount: { fontSize: 24, fontWeight: '800', color: '#C9A84C' },

  // Stats
  statsSection: { paddingBottom: 8 },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 9, color: '#888890', textAlign: 'center' },

  // Chart
  chartSection: { paddingBottom: 8 },
  chart: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    height: 120,
    alignItems: 'flex-end',
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1F1F22',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 6,
    opacity: 0.8,
  },
  chartDay: { fontSize: 9, color: '#888890' },
  chartAmount: { fontSize: 8, color: '#C9A84C', fontWeight: '700' },

  // Tax
  taxSection: { paddingBottom: 8 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  exportIcon: { fontSize: 22 },
  exportText: { flex: 1 },
  exportTitle: { fontSize: 14, fontWeight: '700', color: '#E8E8EA' },
  exportDesc: { fontSize: 12, color: '#888890', marginTop: 2 },
  exportArrow: { fontSize: 20, color: '#C9A84C' },
});