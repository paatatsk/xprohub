import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState('worker');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>Manhattan, NY</Text>
          <Text style={styles.locationArrow}>▾</Text>
        </View>
        <View style={styles.topRight}>
          {/* Mode Toggle */}
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => setMode(mode === 'worker' ? 'customer' : 'worker')}>
            <Text style={styles.modeToggleText}>
              {mode === 'worker' ? '💼 Worker' : '📋 Customer'}
            </Text>
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </View>
      </View>

      {/* XP Level Bar */}
      <View style={styles.xpContainer}>
        <Text style={styles.xpLabel}>⚡ Rising Pro</Text>
        <View style={styles.xpBarBackground}>
          <View style={styles.xpBarFill} />
        </View>
        <Text style={styles.xpText}>2,450 / 5,000 XP</Text>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        {/* Grid lines */}
        <View style={styles.mapGridH1} />
        <View style={styles.mapGridH2} />
        <View style={styles.mapGridV1} />
        <View style={styles.mapGridV2} />

        {/* Worker dots */}
        <View style={[styles.workerDot, { top: '25%', left: '20%' }]}>
          <Text style={styles.workerDotEmoji}>💼</Text>
        </View>
        <View style={[styles.workerDot, { top: '40%', left: '65%' }]}>
          <Text style={styles.workerDotEmoji}>🔧</Text>
        </View>
        <View style={[styles.workerDot, { top: '65%', left: '35%' }]}>
          <Text style={styles.workerDotEmoji}>🧹</Text>
        </View>
        <View style={[styles.workerDotGold, { top: '30%', left: '50%' }]}>
          <Text style={styles.workerDotEmoji}>⭐</Text>
        </View>

        {/* You are here */}
        <View style={styles.youPin}>
          <Text style={styles.youPinText}>📍</Text>
          <Text style={styles.youLabel}>You</Text>
        </View>

        {/* Map label */}
        <View style={styles.mapLabel}>
          <Text style={styles.mapLabelText}>
            {mode === 'worker' ? '🔍 4 jobs nearby' : '👥 12 workers nearby'}
          </Text>
        </View>
      </View>

      {/* Radial Menu Overlay */}
      {menuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.overlayBg}
            onPress={() => setMenuOpen(false)}
          />
          {/* Menu Items */}
          <View style={[styles.menuItem, { bottom: 220, left: width/2 - 120 }]}>
            <TouchableOpacity style={styles.menuItemBtn}>
              <Text style={styles.menuItemIcon}>🧹</Text>
              <Text style={styles.menuItemText}>Cleaning</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuItem, { bottom: 220, right: width/2 - 120 }]}>
            <TouchableOpacity style={styles.menuItemBtn}>
              <Text style={styles.menuItemIcon}>🔧</Text>
              <Text style={styles.menuItemText}>Repairs</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuItem, { bottom: 300, left: width/2 - 40 }]}>
            <TouchableOpacity style={styles.menuItemBtn}>
              <Text style={styles.menuItemIcon}>📦</Text>
              <Text style={styles.menuItemText}>Errands</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuItem, { bottom: 160, left: width/2 - 160 }]}>
            <TouchableOpacity style={styles.menuItemBtn}>
              <Text style={styles.menuItemIcon}>🏆</Text>
              <Text style={styles.menuItemText}>Sports</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuItem, { bottom: 160, right: width/2 - 160 }]}>
            <TouchableOpacity style={styles.menuItemBtn}>
              <Text style={styles.menuItemIcon}>🎭</Text>
              <Text style={styles.menuItemText}>Events</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Center Gold Button */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity
          style={[styles.centerButton, menuOpen && styles.centerButtonOpen]}
         onPress={() => mode === 'customer' ? router.push('/post-job') : setMenuOpen(!menuOpen)}>
          <Text style={styles.centerButtonText}>
            {menuOpen ? '✕' : '+'}
          </Text>
          {!menuOpen && (
            <Text style={styles.centerButtonLabel}>
              {mode === 'worker' ? 'FIND JOBS' : 'POST JOB'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Stats */}
      <View style={styles.bottomStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {mode === 'worker' ? '4' : '12'}
          </Text>
          <Text style={styles.statLabel}>
            {mode === 'worker' ? 'Jobs Near You' : 'Workers Near You'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Your Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>$240</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

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
  locationText: {
    color: '#E8E8EA',
    fontSize: 16,
    fontWeight: '700',
  },
  locationArrow: {
    color: '#C9A84C',
    fontSize: 14,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeToggle: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeToggleText: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },

  // XP Bar
  xpContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpLabel: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '700',
  },
  xpBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#2A2A2E',
    borderRadius: 3,
  },
  xpBarFill: {
    width: '49%',
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 3,
  },
  xpText: {
    color: '#888890',
    fontSize: 11,
  },

  // Map
  mapArea: {
    flex: 1,
    backgroundColor: '#111113',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  mapGridH1: {
    position: 'absolute',
    left: 0, right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapGridH2: {
    position: 'absolute',
    left: 0, right: 0,
    top: '66%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapGridV1: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: '33%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mapGridV2: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: '66%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  workerDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F1F22',
    borderWidth: 1,
    borderColor: '#4CAF7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerDotGold: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerDotEmoji: {
    fontSize: 16,
  },
  youPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -30 }],
    alignItems: 'center',
  },
  youPinText: { fontSize: 24 },
  youLabel: {
    fontSize: 10,
    color: '#C9A84C',
    fontWeight: '700',
  },
  mapLabel: {
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
  mapLabelText: {
    color: '#888890',
    fontSize: 11,
  },

  // Radial Menu
  menuOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
  },
  overlayBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  menuItem: {
    position: 'absolute',
    zIndex: 11,
  },
  menuItemBtn: {
    backgroundColor: '#1F1F22',
    borderWidth: 1,
    borderColor: '#C9A84C',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  menuItemIcon: { fontSize: 22 },
  menuItemText: {
    fontSize: 10,
    color: '#C9A84C',
    fontWeight: '700',
  },

  // Center Button
  centerButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 12,
  },
  centerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  centerButtonOpen: {
    backgroundColor: '#2A2A2E',
    borderWidth: 2,
    borderColor: '#C9A84C',
  },
  centerButtonText: {
    color: '#0E0E0F',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  centerButtonLabel: {
    color: '#0E0E0F',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Bottom Stats
  bottomStats: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#C9A84C',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#888890',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2E2E33',
  },
});