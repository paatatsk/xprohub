import { StatusBar } from 'expo-status-bar';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>S</Text>
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

      {/* Map Background */}
      <View style={styles.mapArea}>
        <View style={styles.mapGrid} />
        <Text style={styles.mapLabel}>📍 Workers near you</Text>
        
        {/* Worker dots on map */}
        <View style={[styles.workerDot, { top: '30%', left: '25%' }]} />
        <View style={[styles.workerDot, { top: '45%', left: '65%' }]} />
        <View style={[styles.workerDot, { top: '60%', left: '40%' }]} />
        <View style={[styles.workerDot, styles.workerDotGold, { top: '35%', left: '55%' }]} />
      </View>

      {/* Center Button */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity style={styles.centerButton}>
          <Text style={styles.centerButtonPlus}>+</Text>
          <Text style={styles.centerButtonLabel}>POST JOB</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Stats */}
      <View style={styles.bottomStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Workers Nearby</Text>
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
  locationPin: {
    fontSize: 14,
  },
  locationText: {
    color: '#E8E8EA',
    fontSize: 16,
    fontWeight: '700',
  },
  locationArrow: {
    color: '#C9A84C',
    fontSize: 14,
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
  mapGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.3,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    color: '#888890',
    fontSize: 11,
    backgroundColor: 'rgba(14,14,15,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  workerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF7A',
    borderWidth: 2,
    borderColor: '#0E0E0F',
  },
  workerDotGold: {
    backgroundColor: '#C9A84C',
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  // Center Button
  centerButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
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
  centerButtonPlus: {
    color: '#0E0E0F',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
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
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2E2E33',
  },
});