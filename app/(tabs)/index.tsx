import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';
import GoldenDollar from '../../components/GoldenDollar';

const { width, height } = Dimensions.get('window');

// ── SPOKE DEFINITIONS ─────────────────────────────────────────────────────────

const LEVEL1_WORKER = [
  {
    icon: '💼', label: 'Work', color: '#4CAF7A', angle: -90,
    subSpokes: [
      { icon: '🔴', label: 'Live Market', route: '/live-market', color: '#FF3B30' },
      { icon: '📋', label: 'My Jobs', route: '/command-center', color: '#4CAF7A' },
      { icon: '⚡', label: 'Command', route: '/command-center', color: '#9B6EE8' },
      { icon: '🥋', label: 'Belt System', route: '/belt-system', color: '#C9A84C' },
      { icon: '👥', label: 'Teams', route: '/team-job', color: '#4CAF7A' },
    ],
  },
  {
    icon: '💳', label: 'Money', color: '#C9A84C', angle: -18,
    subSpokes: [
      { icon: '📊', label: 'Earnings', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '📈', label: 'Bookkeeping', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '💰', label: 'Payouts', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '⭐', label: 'Tips', route: '/bookkeeping', color: '#C9A84C' },
    ],
  },
  {
    icon: '🔐', label: 'Trust', color: '#4A9EDB', angle: 54,
    subSpokes: [
      { icon: '✅', label: 'Verification', route: '/verification', color: '#4A9EDB' },
      { icon: '👤', label: 'Profile', route: '/my-profile', color: '#4A9EDB' },
      { icon: '🏆', label: 'Badges', route: '/xp-levels', color: '#4A9EDB' },
      { icon: '⭐', label: 'Reviews', route: '/review', color: '#4A9EDB' },
    ],
  },
  {
    icon: '⚡', label: 'Growth', color: '#9B6EE8', angle: 126,
    subSpokes: [
      { icon: '🎯', label: 'XP & Levels', route: '/xp-levels', color: '#9B6EE8' },
      { icon: '🥋', label: 'Belt Progress', route: '/belt-system', color: '#9B6EE8' },
      { icon: '🏅', label: 'Achievements', route: '/xp-levels', color: '#9B6EE8' },
      { icon: '📊', label: 'Goals', route: '/xp-levels', color: '#9B6EE8' },
    ],
  },
  {
    icon: '💬', label: 'Messages', color: '#E8E8EA', angle: 198,
    subSpokes: [
      { icon: '💬', label: 'Chat', route: '/chat', color: '#E8E8EA' },
      { icon: '🔔', label: 'Notifications', route: '/notifications', color: '#E8E8EA' },
      { icon: '📢', label: 'Alerts', route: '/notifications', color: '#E8E8EA' },
      { icon: '🆘', label: 'Support', route: '/notifications', color: '#E8E8EA' },
    ],
  },
];

const LEVEL1_CUSTOMER = [
  {
    icon: '🔧', label: 'Hire', color: '#4CAF7A', angle: -90,
    subSpokes: [
      { icon: '📋', label: 'Post Job', route: '/post-job', color: '#4CAF7A' },
      { icon: '🔍', label: 'Find Workers', route: '/worker-match', color: '#4CAF7A' },
      { icon: '⏰', label: 'Active Job', route: '/active-job', color: '#4CAF7A' },
      { icon: '⭐', label: 'Reviews', route: '/review', color: '#4CAF7A' },
    ],
  },
  {
    icon: '💳', label: 'Payments', color: '#C9A84C', angle: -18,
    subSpokes: [
      { icon: '📊', label: 'Spending', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '🧾', label: 'Receipts', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '💰', label: 'Escrow', route: '/payment', color: '#C9A84C' },
      { icon: '💵', label: 'Tips Given', route: '/bookkeeping', color: '#C9A84C' },
    ],
  },
  {
    icon: '👤', label: 'Me', color: '#4A9EDB', angle: 54,
    subSpokes: [
      { icon: '👤', label: 'Profile', route: '/my-profile', color: '#4A9EDB' },
      { icon: '📋', label: 'Job History', route: '/bookkeeping', color: '#4A9EDB' },
      { icon: '🔐', label: 'Verification', route: '/verification', color: '#4A9EDB' },
    ],
  },
  {
    icon: '💬', label: 'Messages', color: '#9B6EE8', angle: 126,
    subSpokes: [
      { icon: '💬', label: 'Chat', route: '/chat', color: '#9B6EE8' },
      { icon: '🔔', label: 'Notifications', route: '/notifications', color: '#9B6EE8' },
      { icon: '📢', label: 'Alerts', route: '/notifications', color: '#9B6EE8' },
    ],
  },
  {
    icon: '🔍', label: 'Explore', color: '#E8E8EA', angle: 198,
    subSpokes: [
      { icon: '🗺️', label: 'Browse', route: '/explore', color: '#E8E8EA' },
      { icon: '📂', label: 'Categories', route: '/explore', color: '#E8E8EA' },
      { icon: '⭐', label: 'Top Workers', route: '/worker-match', color: '#E8E8EA' },
    ],
  },
];

const SPOKE_RADIUS = 125;
const SUB_RADIUS = 95;

function getPosition(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [mode, setMode] = useState('worker');
  const [greeting, setGreeting] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [level, setLevel] = useState(0); // 0 = resting, 1 = spokes open, 2 = sub hub open
  const [activeSpoke, setActiveSpoke] = useState<number | null>(null);

  // Animations
  const spokeAnim = useRef(new Animated.Value(0)).current;
  const subSpokeAnim = useRef(new Animated.Value(0)).current;
  const dollarScale = useRef(new Animated.Value(1)).current;
  const dollarOpacity = useRef(new Animated.Value(1)).current;
  const subHubScale = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const onlineAnim = useRef(new Animated.Value(0)).current;

  const spokes = mode === 'customer' ? LEVEL1_CUSTOMER : LEVEL1_WORKER;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    Animated.timing(statsAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(onlineAnim, {
      toValue: isOnline ? 1 : 0, friction: 6, tension: 40, useNativeDriver: false,
    }).start();
  }, [isOnline]);

  // ── LEVEL TRANSITIONS ──

  const openLevel1 = () => {
    setLevel(1);
    Animated.parallel([
      Animated.spring(spokeAnim, { toValue: 1, friction: 5, tension: 35, useNativeDriver: true }),
      Animated.timing(dollarScale, { toValue: 0.85, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const openLevel2 = (index: number) => {
    setActiveSpoke(index);
    setLevel(2);
    Animated.parallel([
      Animated.timing(spokeAnim, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      Animated.timing(dollarOpacity, { toValue: 0.2, duration: 200, useNativeDriver: true }),
      Animated.spring(subHubScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.spring(subSpokeAnim, { toValue: 1, friction: 5, tension: 35, useNativeDriver: true }),
    ]).start();
  };

  const closeLevel2 = () => {
    setLevel(1);
    Animated.parallel([
      Animated.timing(subSpokeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(subHubScale, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(spokeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(dollarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => setActiveSpoke(null));
  };

  const closeAll = () => {
    setLevel(0);
    setActiveSpoke(null);
    Animated.parallel([
      Animated.timing(spokeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(subSpokeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(subHubScale, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dollarScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(dollarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleDollarPress = () => {
    if (level === 0) openLevel1();
    else closeAll();
  };

  const handleSpokePress = (index: number) => {
    if (level === 1) openLevel2(index);
  };

  const handleModeSwitch = (newMode: string) => {
    if (newMode === mode) return;
    closeAll();
    setTimeout(() => setMode(newMode), 300);
  };

  const handleGoOnline = async () => {
    if (isOnline) { setIsOnline(false); return; }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) { setIsOnline(true); return; }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Your face is your key',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) setIsOnline(true);
    } catch { setIsOnline(true); }
  };

  const currentSpoke = activeSpoke !== null ? spokes[activeSpoke] : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Dev Button */}
      <TouchableOpacity style={styles.devBtn} onPress={() => router.push('/dev-menu')}>
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
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
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
          style={[styles.onlineToggle, isOnline && styles.onlineToggleActive]}
          onPress={handleGoOnline}
          activeOpacity={0.85}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#4CAF7A' : '#555558' }]} />
          <Text style={[styles.onlineToggleText, { color: isOnline ? '#4CAF7A' : '#888890' }]}>
            {isOnline ? '● Online — You are visible to customers' : '● Offline — Tap to go online'}
          </Text>
          <View style={[styles.onlineSwitch, { backgroundColor: isOnline ? '#4CAF7A' : '#2A2A2E' }]}>
            <Animated.View style={[styles.onlineSwitchThumb, {
              left: onlineAnim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }),
            }]} />
          </View>
        </TouchableOpacity>
      )}

      {/* Stats Bar */}
      <Animated.View style={[styles.statsBar, { opacity: statsAnim }]}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mode === 'worker' ? '4' : '12'}</Text>
          <Text style={styles.statLabel}>{mode === 'worker' ? 'Jobs Near' : 'Workers'}</Text>
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
          <Text style={styles.statNumber}>{isOnline ? '🟢' : '⚫'}</Text>
          <Text style={styles.statLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </Animated.View>

      {/* ── HUB AREA ── */}
      <View style={styles.hubContainer}>

        {/* Level 2 — Sub Spokes */}
        {level === 2 && currentSpoke && currentSpoke.subSpokes.map((sub, index) => {
          const totalSubs = currentSpoke.subSpokes.length;
          const angleStep = 360 / totalSubs;
          const startAngle = -90;
          const angle = startAngle + index * angleStep;
          const pos = getPosition(angle, SUB_RADIUS);
          const delay = index * 60;

          return (
            <Animated.View
              key={sub.label}
              style={[styles.spokeWrapper, {
                transform: [
                  { scale: subSpokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
                  { translateX: pos.x },
                  { translateY: pos.y },
                ],
                opacity: subSpokeAnim,
              }]}>
              <TouchableOpacity
                style={[styles.subSpokeBtn, { borderColor: sub.color }]}
                onPress={() => router.push(sub.route as any)}>
                <Text style={styles.spokeIcon}>{sub.icon}</Text>
                <Text style={[styles.spokeLabel, { color: sub.color }]}>{sub.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Level 1 — Main Spokes */}
        {spokes.map((spoke, index) => {
          const pos = getPosition(spoke.angle, SPOKE_RADIUS);
          return (
            <Animated.View
              key={spoke.label}
              style={[styles.spokeWrapper, {
                transform: [
                  { scale: spokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
                  { translateX: pos.x },
                  { translateY: pos.y },
                ],
                opacity: spokeAnim,
              }]}>
              <TouchableOpacity
                style={[
                  styles.spokeBtn,
                  { borderColor: spoke.color },
                  activeSpoke === index && styles.spokeBtnActive,
                ]}
                onPress={() => handleSpokePress(index)}>
                <Text style={styles.spokeIcon}>{spoke.icon}</Text>
                <Text style={[styles.spokeLabel, { color: spoke.color }]}>{spoke.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Sub Hub Center — Level 2 */}
        {level === 2 && currentSpoke && (
          <Animated.View style={[styles.subHubWrapper, {
            transform: [{ scale: subHubScale }],
            opacity: subHubScale,
          }]}>
            <TouchableOpacity
              style={[styles.subHubBtn, { borderColor: currentSpoke.color }]}
              onPress={closeLevel2}
              activeOpacity={0.8}>
              <Text style={styles.subHubIcon}>{currentSpoke.icon}</Text>
              <Text style={[styles.subHubLabel, { color: currentSpoke.color }]}>
                {currentSpoke.label}
              </Text>
              <Text style={styles.subHubBack}>↩ back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Center — Golden Dollar */}
        {level !== 2 && (
          <Animated.View style={[styles.hubCenter, {
            transform: [{ scale: dollarScale }],
            opacity: dollarOpacity,
          }]}>
            <TouchableOpacity onPress={handleDollarPress} activeOpacity={0.85}>
              <GoldenDollar size="large" speed="slow" pulse={true} glow={true} />
            </TouchableOpacity>
            <Text style={styles.hubLabel}>
              {level === 0
                ? (mode === 'worker' ? 'TAP TO EXPLORE' : 'TAP TO EXPLORE')
                : (mode === 'worker' ? (isOnline ? 'FIND WORK' : 'GO ONLINE') : 'POST JOB')}
            </Text>
          </Animated.View>
        )}

        {/* Ghost dollar when in level 2 */}
        {level === 2 && (
          <TouchableOpacity style={styles.ghostDollar} onPress={closeAll}>
            <Text style={styles.ghostDollarText}>$</Text>
            <Text style={styles.ghostDollarLabel}>home</Text>
          </TouchableOpacity>
        )}

      </View>

      {/* XP Bar */}
      {mode === 'worker' && (
        <TouchableOpacity style={styles.xpBar} onPress={() => router.push('/xp-levels')}>
          <Text style={styles.xpLabel}>⚡ Trusted Expert</Text>
          <View style={styles.xpBarBg}>
            <View style={styles.xpBarFill} />
          </View>
          <Text style={styles.xpText}>2,450 XP</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/explore')}>
          <Text style={styles.bottomBtnIcon}>🗺️</Text>
          <Text style={styles.bottomBtnText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/notifications')}>
          <Text style={styles.bottomBtnIcon}>🔔</Text>
          <Text style={styles.bottomBtnText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/my-profile')}>
          <Text style={styles.bottomBtnIcon}>👤</Text>
          <Text style={styles.bottomBtnText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => router.push('/belt-system')}>
          <Text style={styles.bottomBtnIcon}>🥋</Text>
          <Text style={styles.bottomBtnText}>Belts</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  devBtn: {
    position: 'absolute', top: 52, right: 20, zIndex: 99,
    backgroundColor: 'rgba(14,14,15,0.8)', borderWidth: 1,
    borderColor: '#2E2E33', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnText: { color: '#888890', fontSize: 12, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  avatarText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  location: { fontSize: 12, color: '#888890', marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#C9A84C',
    borderWidth: 1, borderColor: '#0E0E0F',
  },

  modeToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 4, gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: {
    backgroundColor: '#C9A84C',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#888890' },
  modeBtnTextActive: { color: '#0E0E0F' },

  onlineToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 20, marginBottom: 10,
  },
  onlineToggleActive: {
    borderColor: 'rgba(76,175,122,0.4)',
    backgroundColor: 'rgba(76,175,122,0.06)',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineToggleText: { fontSize: 13, fontWeight: '700', flex: 1 },
  onlineSwitch: { width: 46, height: 26, borderRadius: 13, position: 'relative' },
  onlineSwitchThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF',
    position: 'absolute', top: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  statsBar: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2E2E33',
    paddingVertical: 10, marginBottom: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 9, color: '#888890' },
  statDivider: { width: 1, backgroundColor: '#2E2E33' },

  hubContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },

  spokeWrapper: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  spokeBtn: {
    backgroundColor: '#171719', borderWidth: 1.5, borderRadius: 18,
    padding: 10, alignItems: 'center', gap: 4, minWidth: 72,
  },
  spokeBtnActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
  },
  subSpokeBtn: {
    backgroundColor: '#171719', borderWidth: 1.5, borderRadius: 16,
    padding: 8, alignItems: 'center', gap: 3, minWidth: 64,
  },
  spokeIcon: { fontSize: 22 },
  spokeLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },

  subHubWrapper: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  subHubBtn: {
    backgroundColor: '#171719', borderWidth: 2, borderRadius: 24,
    padding: 16, alignItems: 'center', gap: 4, minWidth: 90,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  subHubIcon: { fontSize: 28 },
  subHubLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  subHubBack: { fontSize: 10, color: '#555558', marginTop: 2 },

  hubCenter: { alignItems: 'center', gap: 8, zIndex: 10 },
  hubLabel: {
    fontSize: 11, fontWeight: '800', color: '#C9A84C', letterSpacing: 2,
  },

  ghostDollar: {
    position: 'absolute', bottom: -60,
    alignItems: 'center', opacity: 0.2,
  },
  ghostDollarText: {
    fontSize: 32, fontWeight: '800', color: '#C9A84C',
  },
  ghostDollarLabel: { fontSize: 9, color: '#C9A84C', letterSpacing: 1 },

  xpBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 20, marginBottom: 10,
  },
  xpLabel: { fontSize: 11, color: '#C9A84C', fontWeight: '700' },
  xpBarBg: {
    flex: 1, height: 6, backgroundColor: '#2A2A2E', borderRadius: 3, overflow: 'hidden',
  },
  xpBarFill: { width: '49%', height: '100%', backgroundColor: '#C9A84C', borderRadius: 3 },
  xpText: { fontSize: 11, color: '#888890' },

  bottomBar: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderTopWidth: 1, borderTopColor: '#2E2E33',
    paddingVertical: 12, paddingBottom: 28,
  },
  bottomBtn: { flex: 1, alignItems: 'center', gap: 4 },
  bottomBtnIcon: { fontSize: 22 },
  bottomBtnText: { fontSize: 10, color: '#888890', fontWeight: '600' },
});