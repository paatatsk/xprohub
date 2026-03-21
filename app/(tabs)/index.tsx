import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../../components/GoldenDollar';

const { width, height } = Dimensions.get('window');
const CENTER = width / 2;

const CUSTOMER_SPOKES = [
  { icon: '📋', label: 'Post Job', route: '/post-job', angle: -90, color: '#C9A84C', badge: null },
  { icon: '🔍', label: 'Find Workers', route: '/worker-match', angle: -30, color: '#4CAF7A', badge: '12' },
  { icon: '🗺️', label: 'Explore', route: '/explore', angle: 30, color: '#5599E0', badge: null },
  { icon: '💬', label: 'Chat', route: '/chat', angle: 90, color: '#9B6EE8', badge: '2' },
  { icon: '💳', label: 'Payments', route: '/payment', angle: 150, color: '#C9A84C', badge: null },
  { icon: '📊', label: 'Bookkeeping', route: '/bookkeeping', angle: 210, color: '#4CAF7A', badge: null },
];

const WORKER_SPOKES = [
  { icon: '🔴', label: 'Live Market', route: '/live-market', angle: -90, color: '#FF3B30', badge: '6' },
  { icon: '💼', label: 'Find Jobs', route: '/worker-match', angle: -30, color: '#C9A84C', badge: '4' },
  { icon: '⚡', label: 'Command', route: '/command-center', angle: 30, color: '#9B6EE8', badge: null },
  { icon: '💬', label: 'Chat', route: '/chat', angle: 90, color: '#4CAF7A', badge: '1' },
  { icon: '🥋', label: 'Belt System', route: '/belt-system', angle: 150, color: '#C9A84C', badge: null },
  { icon: '📊', label: 'Earnings', route: '/bookkeeping', angle: 210, color: '#5599E0', badge: null },
];

const SPOKE_RADIUS = 130;

function getPosition(angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

export default function HomeScreen() {
  const [mode, setMode] = useState('worker');
  const [greeting, setGreeting] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const spokeAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const onlineAnim = useRef(new Animated.Value(0)).current;

  const spokes = mode === 'customer' ? CUSTOMER_SPOKES : WORKER_SPOKES;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    Animated.parallel([
      Animated.spring(spokeAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  // Animate online toggle
  useEffect(() => {
    Animated.spring(onlineAnim, {
      toValue: isOnline ? 1 : 0,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    Animated.timing(spokeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMode(newMode);
    });
  };

  const handleGoOnline = async () => {
    // Going offline needs no authentication
    if (isOnline) {
      setIsOnline(false);
      return;
    }
    // Going online requires Face ID
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Device has no biometrics — allow online anyway
        setIsOnline(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Your face is your key',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        setIsOnline(true);
      }
    } catch (error) {
      // Fallback — allow online if auth fails unexpectedly
      setIsOnline(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Menu Button */}
      <TouchableOpacity
        style={styles.devBtn}
        onPress={() => router.push('/dev-menu')}>
        <Text style={styles.devBtnText}>🛠️ Dev</Text>
      </TouchableOpacity>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/my-profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting}, Sofia! 👋</Text>
          <Text style={styles.location}>📍 Manhattan, NY</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications')}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'customer' && styles.modeBtnActive]}
          onPress={() => handleModeSwitch('customer')}>
          <Text style={[styles.modeBtnText, mode === 'customer' && styles.modeBtnTextActive]}>
            📋 Hire Someone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'worker' && styles.modeBtnActive]}
          onPress={() => handleModeSwitch('worker')}>
          <Text style={[styles.modeBtnText, mode === 'worker' && styles.modeBtnTextActive]}>
            💼 Find Work
          </Text>
        </TouchableOpacity>
      </View>

      {/* Online Toggle — Worker Mode Only */}
      {mode === 'worker' && (
        <TouchableOpacity
          style={[
            styles.onlineToggle,
            isOnline && styles.onlineToggleActive,
          ]}
          onPress={handleGoOnline}
          activeOpacity={0.85}>
          <View style={[
            styles.onlineDot,
            { backgroundColor: isOnline ? '#4CAF7A' : '#555558' }
          ]} />
          <Text style={[
            styles.onlineToggleText,
            { color: isOnline ? '#4CAF7A' : '#888890' }
          ]}>
            {isOnline
              ? '● Online — You are visible to customers'
              : '● Offline — Tap to go online'}
          </Text>
          <View style={[
            styles.onlineSwitch,
            { backgroundColor: isOnline ? '#4CAF7A' : '#2A2A2E' }
          ]}>
            <Animated.View style={[
              styles.onlineSwitchThumb,
              {
                left: onlineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [3, 23],
                }),
              }
            ]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Live Stats Bar */}
      <Animated.View style={[styles.statsBar, { opacity: statsAnim }]}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {mode === 'worker' ? '4' : '12'}
          </Text>
          <Text style={styles.statLabel}>
            {mode === 'worker' ? 'Jobs Near' : 'Workers'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>🔴 6</Text>
          <Text style={styles.statLabel}>Live Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>★ 4.9</Text>
          <Text style={styles.statLabel}>Your Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {isOnline ? '🟢' : '⚫'}
          </Text>
          <Text style={styles.statLabel}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </Animated.View>

      {/* HUB AND SPOKE */}
      <View style={styles.hubContainer}>

        {/* Spokes */}
        {spokes.map((spoke, index) => {
          const pos = getPosition(spoke.angle, SPOKE_RADIUS);
          return (
            <Animated.View
              key={spoke.label}
              style={[
                styles.spokeWrapper,
                {
                  transform: [
                    {
                      scale: spokeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                    { translateX: pos.x },
                    { translateY: pos.y },
                  ],
                  opacity: spokeAnim,
                },
              ]}>

              {/* Spoke Line */}
              <View style={[styles.spokeLine, {
                width: SPOKE_RADIUS - 50,
                transform: [
                  { rotate: `${spoke.angle}deg` },
                  { translateX: -(SPOKE_RADIUS - 50) / 2 },
                ],
              }]} />

              {/* Spoke Button */}
              <TouchableOpacity
                style={[styles.spokeBtn, { borderColor: spoke.color }]}
                onPress={() => router.push(spoke.route)}>
                <Text style={styles.spokeIcon}>{spoke.icon}</Text>
                <Text style={[styles.spokeLabel, { color: spoke.color }]}>{spoke.label}</Text>
                {spoke.badge && (
                  <View style={[styles.spokeBadge, { backgroundColor: spoke.color }]}>
                    <Text style={styles.spokeBadgeText}>{spoke.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>

            </Animated.View>
          );
        })}

        {/* Center Hub — Golden Dollar */}
        <TouchableOpacity
          style={styles.hubCenter}
          onPress={() => router.push(mode === 'worker' ? '/live-market' : '/post-job')}>
          <GoldenDollar size="large" speed="slow" pulse={true} glow={true} />
          <Text style={styles.hubLabel}>
            {mode === 'worker'
              ? (isOnline ? 'FIND WORK' : 'GO ONLINE')
              : 'POST JOB'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* XP Bar */}
      {mode === 'worker' && (
        <TouchableOpacity
          style={styles.xpBar}
          onPress={() => router.push('/xp-levels')}>
          <Text style={styles.xpLabel}>⚡ Trusted Expert</Text>
          <View style={styles.xpBarBg}>
            <View style={styles.xpBarFill} />
          </View>
          <Text style={styles.xpText}>2,450 XP</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Quick Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push('/explore')}>
          <Text style={styles.bottomBtnIcon}>🗺️</Text>
          <Text style={styles.bottomBtnText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push('/notifications')}>
          <Text style={styles.bottomBtnIcon}>🔔</Text>
          <Text style={styles.bottomBtnText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push('/my-profile')}>
          <Text style={styles.bottomBtnIcon}>👤</Text>
          <Text style={styles.bottomBtnText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => router.push('/belt-system')}>
          <Text style={styles.bottomBtnIcon}>🥋</Text>
          <Text style={styles.bottomBtnText}>Belts</Text>
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

  // Dev Button
  devBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 99,
    backgroundColor: 'rgba(14,14,15,0.8)',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  devBtnText: { color: '#888890', fontSize: 12, fontWeight: '600' },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  location: { fontSize: 12, color: '#888890', marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A84C',
    borderWidth: 1,
    borderColor: '#0E0E0F',
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
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

  // Online Toggle
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  onlineToggleActive: {
    borderColor: 'rgba(76,175,122,0.4)',
    backgroundColor: 'rgba(76,175,122,0.06)',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineToggleText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  onlineSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    position: 'relative',
  },
  onlineSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

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
  statNumber: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 9, color: '#888890' },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },

  // Hub Container
  hubContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Spoke
  spokeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokeLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  spokeBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    minWidth: 68,
    position: 'relative',
  },
  spokeIcon: { fontSize: 22 },
  spokeLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  spokeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0E0E0F',
  },
  spokeBadgeText: { fontSize: 9, color: '#0E0E0F', fontWeight: '800' },

  // Hub Center
  hubCenter: {
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C9A84C',
    letterSpacing: 2,
  },

  // XP Bar
  xpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  xpLabel: { fontSize: 11, color: '#C9A84C', fontWeight: '700' },
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

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
    paddingVertical: 12,
    paddingBottom: 28,
  },
  bottomBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bottomBtnIcon: { fontSize: 22 },
  bottomBtnText: { fontSize: 10, color: '#888890', fontWeight: '600' },
});