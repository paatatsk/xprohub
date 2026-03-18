import HomeBeacon from '@/components/HomeBeacon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'job',
    icon: '💼',
    title: 'New Job Match!',
    message: 'A deep cleaning job near you — $75 · Manhattan · ASAP',
    time: '2 min ago',
    read: false,
    color: '#C9A84C',
  },
  {
    id: 2,
    type: 'message',
    icon: '💬',
    title: 'Sofia Rodriguez',
    message: 'Hi! I am on my way, will be there in 10 minutes 😊',
    time: '15 min ago',
    read: false,
    color: '#4CAF7A',
  },
  {
    id: 3,
    type: 'payment',
    icon: '💰',
    title: 'Payment Released!',
    message: 'Your payment of $75 for Deep Cleaning has been released to your account',
    time: '1 hr ago',
    read: false,
    color: '#C9A84C',
  },
  {
    id: 4,
    type: 'review',
    icon: '⭐',
    title: 'New Review Received!',
    message: 'Michael T. gave you 5 stars — "Amazing work, so thorough!"',
    time: '2 hrs ago',
    read: true,
    color: '#C9A84C',
  },
  {
    id: 5,
    type: 'xp',
    icon: '⚡',
    title: 'Level Up!',
    message: 'Congratulations! You reached Level 8 — Trusted Expert 🎉',
    time: '3 hrs ago',
    read: true,
    color: '#9B6EE8',
  },
  {
    id: 6,
    type: 'job',
    icon: '💼',
    title: 'Job Confirmed!',
    message: 'Jennifer K. confirmed your booking for Regular Cleaning tomorrow at 1 PM',
    time: '5 hrs ago',
    read: true,
    color: '#4CAF7A',
  },
  {
    id: 7,
    type: 'system',
    icon: '🛡️',
    title: 'XProHub Protection Active',
    message: 'Your job is covered up to $5,000. Have a great job today!',
    time: 'Yesterday',
    read: true,
    color: '#5599E0',
  },
  {
    id: 8,
    type: 'payment',
    icon: '💰',
    title: 'Payout Sent!',
    message: '$240 has been sent to your bank account. Should arrive in 1-2 business days.',
    time: 'Yesterday',
    read: true,
    color: '#4CAF7A',
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    { key: 'job', label: '💼 Jobs' },
    { key: 'message', label: '💬 Messages' },
    { key: 'payment', label: '💰 Payments' },
  ];

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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAllBtn}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.key)}>
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>No notifications here</Text>
          </View>
        )}

        {filteredNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notifCard, !notification.read && styles.notifCardUnread]}
            onPress={() => markRead(notification.id)}>

            {/* Icon */}
            <View style={[styles.notifIcon, { backgroundColor: `${notification.color}15` }]}>
              <Text style={styles.notifIconText}>{notification.icon}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>

            {/* Content */}
            <View style={styles.notifContent}>
              <View style={styles.notifTop}>
                <Text style={[styles.notifTitle, !notification.read && styles.notifTitleUnread]}>
                  {notification.title}
                </Text>
                <Text style={styles.notifTime}>{notification.time}</Text>
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>

          </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  backBtn: { color: '#888890', fontSize: 16 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },
  unreadBadge: {
    backgroundColor: '#C9A84C',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#0E0E0F' },
  markAllBtn: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },

  // Filters
  filterBar: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#2E2E33' },
  filterBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  filterText: { fontSize: 12, color: '#888890', fontWeight: '600' },
  filterTextActive: { color: '#C9A84C' },

  // List
  list: { flex: 1 },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1D',
  },
  notifCardUnread: {
    backgroundColor: 'rgba(201,168,76,0.03)',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  notifIconText: { fontSize: 20 },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C9A84C',
    borderWidth: 2,
    borderColor: '#0E0E0F',
  },
  notifContent: { flex: 1 },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  notifTitle: { fontSize: 13, fontWeight: '600', color: '#888890', flex: 1 },
  notifTitleUnread: { color: '#E8E8EA', fontWeight: '700' },
  notifTime: { fontSize: 11, color: '#444450', flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#888890', lineHeight: 18 },

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