import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const QUICK_CATEGORIES = [
  { icon: '🧹', name: 'Cleaning' },
  { icon: '🔧', name: 'Repairs' },
  { icon: '🛒', name: 'Errands' },
  { icon: '🐾', name: 'Pet Care' },
  { icon: '💪', name: 'Sports' },
  { icon: '🎉', name: 'Events' },
  { icon: '💻', name: 'IT Help' },
  { icon: '🍽️', name: 'Catering' },
];

export default function HomeScreen() {
  const [mode, setMode] = useState('customer');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Menu Button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 52, left: 20, zIndex: 99, backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1, borderColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
        onPress={() => router.push('/dev-menu')}>
        <Text style={{ color: '#888890', fontSize: 12, fontWeight: '600' }}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>Manhattan, NY</Text>
          <Text style={styles.locationArrow}>▾</Text>
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}>
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/my-profile')}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>S</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'customer' && styles.modeBtnActive]}
          onPress={() => setMode('customer')}>
          <Text style={[styles.modeBtnText, mode === 'customer' && styles.modeBtnTextActive]}>
            📋 Hire Someone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'worker' && styles.modeBtnActive]}
          onPress={() => setMode('worker')}>
          <Text style={[styles.modeBtnText, mode === 'worker' && styles.modeBtnTextActive]}>
            💼 Find Work
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        {/* Grid lines */}
        <View style={[styles.mapGrid, { top: '33%', left: 0, right: 0, height: 1 }]} />
        <View style={[styles.mapGrid, { top: '66%', left: 0, right: 0, height: 1 }]} />
        <View style={[styles.mapGrid, { left: '33%', top: 0, bottom: 0, width: 1 }]} />
        <View style={[styles.mapGrid, { left: '66%', top: 0, bottom: 0, width: 1 }]} />

        {/* Worker dots */}
        {[
          { top: '22%', left: '18%', emoji: '💼', color: '#4CAF7A' },
          { top: '38%', left: '62%', emoji: '🔧', color: '#5599E0' },
          { top: '62%', left: '30%', emoji: '🧹', color: '#9B6EE8' },
          { top: '28%', left: '48%', emoji: '⭐', color: '#C9A84C' },
        ].map((dot, i) => (
          <View key={i} style={[styles.workerDot, { top: dot.top, left: dot.left, borderColor: dot.color }]}>
            <Text style={styles.workerDotEmoji}>{dot.emoji}</Text>
          </View>
        ))}

        {/* You pin */}
        <View style={styles.youPin}>
          <Text style={styles.youPinText}>📍</Text>
          <Text style={styles.youLabel}>You</Text>
        </View>

        {/* Map info badge */}
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            {mode === 'worker' ? '💼 4 jobs near you' : '👥 12 workers nearby'}
          </Text>
        </View>
      </View>

      {/* CUSTOMER MODE */}
      {mode === 'customer' && (
        <View style={styles.actionSection}>
          {/* Main Action Button */}
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => router.push('/post-job')}>
            <Text style={styles.mainActionIcon}>+</Text>
            <View>
              <Text style={styles.mainActionTitle}>Post a Job</Text>
              <Text style={styles.mainActionSub}>Find someone in minutes</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Categories */}
          <Text style={styles.quickLabel}>QUICK HIRE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickCategories}>
            {QUICK_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.quickCat}
                onPress={() => router.push('/post-job')}>
                <Text style={styles.quickCatIcon}>{cat.icon}</Text>
                <Text style={styles.quickCatName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* WORKER MODE */}
      {mode === 'worker' && (
        <View style={styles.actionSection}>
          {/* XP Bar */}
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>⚡ Trusted Expert</Text>
            <View style={styles.xpBarBg}>
              <View style={styles.xpBarFill} />
            </View>
            <Text style={styles.xpText}>2,450 XP</Text>
          </View>

          {/* Main Action Button */}
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => router.push('/worker-match')}>
            <Text style={styles.mainActionIcon}>🔍</Text>
            <View>
              <Text style={styles.mainActionTitle}>Find Jobs Near Me</Text>
              <Text style={styles.mainActionSub}>4 jobs available now</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
  style={styles.liveMarketBtn}
  onPress={() => router.push('/live-market')}>
  <View style={styles.liveDot} />
  <Text style={styles.liveMarketText}>🔴 Live Market — 6 jobs now</Text>
</TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>★ 4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>84</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>$240</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/command-center')}>
              <Text style={styles.statNumber}>⚡</Text>
              <Text style={[styles.statLabel, { color: '#C9A84C' }]}>Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationPin: { fontSize: 14 },
  locationText: { color: '#E8E8EA', fontSize: 16, fontWeight: '700' },
  locationArrow: { color: '#C9A84C', fontSize: 14 },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A84C',
    borderWidth: 1,
    borderColor: '#0E0E0F',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },

  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#888890' },
  modeBtnTextActive: { color: '#0E0E0F' },

  // Map
  mapArea: {
    flex: 1,
    backgroundColor: '#111113',
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2E2E33',
    marginBottom: 12,
  },
  mapGrid: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  workerDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F1F22',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerDotEmoji: { fontSize: 16 },
  youPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -28 }],
    alignItems: 'center',
  },
  youPinText: { fontSize: 24 },
  youLabel: { fontSize: 10, color: '#C9A84C', fontWeight: '700' },
  mapBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(14,14,15,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  mapBadgeText: { color: '#888890', fontSize: 11 },

  // Action Section
  actionSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // Main Action Button
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A84C',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  mainActionIcon: {
    fontSize: 28,
    color: '#0E0E0F',
    fontWeight: '800',
    width: 36,
    textAlign: 'center',
  },
  mainActionTitle: { fontSize: 18, fontWeight: '800', color: '#0E0E0F' },
  mainActionSub: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 2 },

  // Quick Categories
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: -4,
  },
  quickCategories: { gap: 8, paddingRight: 4 },
  quickCat: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  quickCatIcon: { fontSize: 22 },
  quickCatName: { fontSize: 10, color: '#E8E8EA', fontWeight: '600' },

  // XP Row
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  xpLabel: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },
  xpBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#2A2A2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    width: '49%',
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
  },
  xpText: { fontSize: 11, color: '#888890' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 10, color: '#888890' },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },
  liveMarketBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#171719',
  borderWidth: 1,
  borderColor: 'rgba(255,59,48,0.3)',
  borderRadius: 14,
  padding: 14,
  gap: 10,
},
liveDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#FF3B30',
},
liveMarketText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#E8E8EA',
},
});