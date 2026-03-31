import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import GoldenDollar from '../../components/GoldenDollar';

const { width, height } = Dimensions.get('window');

function getPos(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

const SPOKES_WORKER = [
  {
    icon: '💼', label: 'Work', color: '#4CAF7A', angle: -90,
    subs: [
      { icon: '🔴', label: 'Live Market', route: '/live-market', color: '#FF3B30' },
      { icon: '📋', label: 'My Jobs', route: '/command-center', color: '#4CAF7A' },
      { icon: '🥋', label: 'Belt', route: '/belt-system', color: '#C9A84C' },
      { icon: '👥', label: 'Teams', route: '/team-job', color: '#4CAF7A' },
    ],
  },
  {
    icon: '💳', label: 'Money', color: '#C9A84C', angle: -18,
    subs: [
      { icon: '📊', label: 'Earnings', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '💰', label: 'Payouts', route: '/payment', color: '#C9A84C' },
      { icon: '🧾', label: 'Receipts', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '⭐', label: 'Tips', route: '/tip', color: '#C9A84C' },
    ],
  },
  {
    icon: '🔐', label: 'Trust', color: '#4A9EDB', angle: 54,
    subs: [
      { icon: '✅', label: 'Verify', route: '/verification', color: '#4A9EDB' },
      { icon: '👤', label: 'Profile', route: '/my-profile', color: '#4A9EDB' },
      { icon: '🏆', label: 'Badges', route: '/xp-levels', color: '#4A9EDB' },
      { icon: '⭐', label: 'Reviews', route: '/review', color: '#4A9EDB' },
    ],
  },
  {
    icon: '⚡', label: 'Growth', color: '#9B6EE8', angle: 126,
    subs: [
      { icon: '🎯', label: 'XP', route: '/xp-levels', color: '#9B6EE8' },
      { icon: '🥋', label: 'Belts', route: '/belt-system', color: '#9B6EE8' },
      { icon: '🏅', label: 'Badges', route: '/xp-levels', color: '#9B6EE8' },
      { icon: '📈', label: 'Goals', route: '/xp-levels', color: '#9B6EE8' },
    ],
  },
  {
    icon: '💬', label: 'Chat', color: '#E8E8EA', angle: 198,
    subs: [
      { icon: '💬', label: 'Chat', route: '/chat', color: '#E8E8EA' },
      { icon: '🔔', label: 'Alerts', route: '/notifications', color: '#E8E8EA' },
      { icon: '🆘', label: 'Support', route: '/notifications', color: '#E8E8EA' },
    ],
  },
];

const SPOKES_CUSTOMER = [
  {
    icon: '🔧', label: 'Hire', color: '#4CAF7A', angle: -90,
    subs: [
      { icon: '📋', label: 'Post Job', route: '/post-job', color: '#4CAF7A' },
      { icon: '🔍', label: 'Find Workers', route: '/worker-match', color: '#4CAF7A' },
      { icon: '⏰', label: 'Active Job', route: '/active-job', color: '#4CAF7A' },
      { icon: '⭐', label: 'Reviews', route: '/review', color: '#4CAF7A' },
    ],
  },
  {
    icon: '💳', label: 'Payments', color: '#C9A84C', angle: -18,
    subs: [
      { icon: '📊', label: 'Spending', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '🧾', label: 'Receipts', route: '/bookkeeping', color: '#C9A84C' },
      { icon: '💰', label: 'Escrow', route: '/payment', color: '#C9A84C' },
      { icon: '💵', label: 'Tips', route: '/tip', color: '#C9A84C' },
    ],
  },
  {
    icon: '👤', label: 'Me', color: '#4A9EDB', angle: 54,
    subs: [
      { icon: '👤', label: 'Profile', route: '/my-profile', color: '#4A9EDB' },
      { icon: '📋', label: 'History', route: '/bookkeeping', color: '#4A9EDB' },
      { icon: '🔐', label: 'Verify', route: '/verification', color: '#4A9EDB' },
    ],
  },
  {
    icon: '💬', label: 'Messages', color: '#9B6EE8', angle: 126,
    subs: [
      { icon: '💬', label: 'Chat', route: '/chat', color: '#9B6EE8' },
      { icon: '🔔', label: 'Alerts', route: '/notifications', color: '#9B6EE8' },
      { icon: '📢', label: 'Updates', route: '/notifications', color: '#9B6EE8' },
    ],
  },
  {
    icon: '🔍', label: 'Explore', color: '#E8E8EA', angle: 198,
    subs: [
      { icon: '🗺️', label: 'Browse', route: '/explore', color: '#E8E8EA' },
      { icon: '📂', label: 'Categories', route: '/explore', color: '#E8E8EA' },
      { icon: '⭐', label: 'Top Workers', route: '/worker-match', color: '#E8E8EA' },
    ],
  },
];

const QUICK_WORKER = [
  { icon: '🔴', label: 'Live Market', route: '/live-market', color: '#FF3B30' },
  { icon: '📋', label: 'My Jobs', route: '/command-center', color: '#4CAF7A' },
  { icon: '💬', label: 'Chat', route: '/chat', color: '#9B6EE8' },
  { icon: '💰', label: 'Earnings', route: '/bookkeeping', color: '#C9A84C' },
];

const QUICK_CUSTOMER = [
  { icon: '📋', label: 'Post Job', route: '/post-job', color: '#4CAF7A' },
  { icon: '🔍', label: 'Find Workers', route: '/worker-match', color: '#4A9EDB' },
  { icon: '💬', label: 'Chat', route: '/chat', color: '#9B6EE8' },
  { icon: '💰', label: 'Payments', route: '/payment', color: '#C9A84C' },
];

const RECENT_WORKER = [
  { icon: '✅', text: 'Job completed — Plumbing repair', time: '2h ago', color: '#4CAF7A' },
  { icon: '💰', text: '$85 payment received', time: '2h ago', color: '#C9A84C' },
  { icon: '⭐', text: 'New 5★ review from Sarah M.', time: '5h ago', color: '#C9A84C' },
  { icon: '🔴', text: '4 new jobs near you', time: '1h ago', color: '#FF3B30' },
];

const RECENT_CUSTOMER = [
  { icon: '🔧', text: 'Worker arriving in 12 min', time: 'Now', color: '#4CAF7A' },
  { icon: '💬', text: 'New message from Mike T.', time: '30m ago', color: '#9B6EE8' },
  { icon: '✅', text: 'Job confirmed — Cleaning', time: '1h ago', color: '#4CAF7A' },
  { icon: '💰', text: 'Payment of $120 processed', time: '3h ago', color: '#C9A84C' },
];

// ── HUB MODAL COMPONENT ───────────────────────────────────────────────────────
function HubModal({
  visible, mode, spokes, onClose, onNavigate,
}: {
  visible: boolean;
  mode: string;
  spokes: typeof SPOKES_WORKER;
  onClose: () => void;
  onNavigate: (route: string) => void;
}) {
  const [hubLevel, setHubLevel] = useState<0 | 1 | 2>(0);
  const [activeSpokeIndex, setActiveSpokeIndex] = useState<number | null>(null);
  const spokeAnim = useRef(new Animated.Value(0)).current;

  const cx = width / 2;
  const cy = height / 2 - 20;
  const SPOKE_R = 130;
  const SUB_R = 110;

  const currentSpoke = activeSpokeIndex !== null ? spokes[activeSpokeIndex] : null;

  useEffect(() => {
    if (visible) {
      setHubLevel(0);
      setActiveSpokeIndex(null);
      spokeAnim.setValue(0);
      setTimeout(() => {
        setHubLevel(1);
        Animated.spring(spokeAnim, {
          toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
        }).start();
      }, 100);
    } else {
      setHubLevel(0);
      setActiveSpokeIndex(null);
      spokeAnim.setValue(0);
    }
  }, [visible]);

  const openSubs = (index: number) => {
    Animated.timing(spokeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setActiveSpokeIndex(index);
      setHubLevel(2);
    });
  };

  const backToSpokes = () => {
    setHubLevel(1);
    setActiveSpokeIndex(null);
    spokeAnim.setValue(0);
    Animated.spring(spokeAnim, {
      toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
    }).start();
  };

  const handleSubTap = (route: string) => {
    onNavigate(route);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={m.overlay}>

        {/* Close button */}
        <TouchableOpacity style={m.closeBtn} onPress={onClose}>
          <Text style={m.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>

        {/* Hint */}
        <Text style={m.hubHint}>
          {hubLevel === 1 ? 'Tap a spoke to explore' : 'Tap an option to open it'}
        </Text>

        {/* LEVEL 1 — Main spokes */}
        {hubLevel === 1 && spokes.map((spoke, i) => {
          const pos = getPos(spoke.angle, SPOKE_R);
          return (
            <Animated.View
              key={spoke.label}
              style={[m.node, {
                left: cx + pos.x - 38,
                top: cy + pos.y - 38,
                opacity: spokeAnim,
                transform: [{ scale: spokeAnim }],
              }]}
            >
              <TouchableOpacity
                style={[m.spokeBtn, { borderColor: spoke.color }]}
                onPress={() => openSubs(i)}
                activeOpacity={0.8}
              >
                <Text style={m.spokeIcon}>{spoke.icon}</Text>
                <Text style={[m.spokeLabel, { color: spoke.color }]}>{spoke.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* LEVEL 2 — Sub spokes — NO animation, just render directly */}
        {hubLevel === 2 && currentSpoke && (
          <>
            {/* Sub hub center */}
            <TouchableOpacity
              style={[m.node, m.subHubBtn, {
                left: cx - 46,
                top: cy - 46,
                borderColor: currentSpoke.color,
              }]}
              onPress={backToSpokes}
              activeOpacity={0.8}
            >
              <Text style={m.subHubIcon}>{currentSpoke.icon}</Text>
              <Text style={[m.subHubName, { color: currentSpoke.color }]}>
                {currentSpoke.label}
              </Text>
              <Text style={m.subHubBack}>↩ back</Text>
            </TouchableOpacity>

            {/* Sub spokes */}
            {currentSpoke.subs.map((sub, i) => {
              const total = currentSpoke.subs.length;
              const angle = -90 + i * (360 / total);
              const pos = getPos(angle, SUB_R);
              return (
                <TouchableOpacity
                  key={sub.label}
                  style={[m.node, m.subBtn, {
                    left: cx + pos.x - 34,
                    top: cy + pos.y - 34,
                    borderColor: sub.color,
                  }]}
                  onPress={() => handleSubTap(sub.route)}
                  activeOpacity={0.8}
                >
                  <Text style={m.subIcon}>{sub.icon}</Text>
                  <Text style={[m.subLabel, { color: sub.color }]}>{sub.label}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* CENTER: Golden Dollar — level 1 only */}
        {hubLevel === 1 && (
          <View style={[m.node, { left: cx - 46, top: cy - 46, zIndex: 20 }]}>
            <GoldenDollar size="large" speed="slow" pulse={true} glow={true} />
            <Text style={m.hubLabel}>SELECT A SPOKE</Text>
          </View>
        )}

      </View>
    </Modal>
  );
}

// ── MAIN HOME SCREEN ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [mode, setMode] = useState<'worker' | 'customer'>('worker');
  const [greeting, setGreeting] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [hubVisible, setHubVisible] = useState(false);
const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const onlineAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  const spokes = mode === 'worker' ? SPOKES_WORKER : SPOKES_CUSTOMER;
  const quickActions = mode === 'worker' ? QUICK_WORKER : QUICK_CUSTOMER;
  const recentActivity = mode === 'worker' ? RECENT_WORKER : RECENT_CUSTOMER;
  useEffect(() => {
  if (!hubVisible && pendingRoute) {
    router.push(pendingRoute as any);
    setPendingRoute(null);
  }
}, [hubVisible, pendingRoute]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    Animated.timing(statsAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(onlineAnim, {
      toValue: isOnline ? 1 : 0, friction: 6, tension: 40, useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const handleGoOnline = async () => {
    if (isOnline) { setIsOnline(false); return; }
    try {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !enrolled) { setIsOnline(true); return; }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Your face is your key 🔐',
        fallbackLabel: 'Use passcode',
      });
      if (res.success) setIsOnline(true);
    } catch { setIsOnline(true); }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* ── HUB MODAL ── */}
      <HubModal
  visible={hubVisible}
  mode={mode}
  spokes={spokes}
  onClose={() => setHubVisible(false)}
  onNavigate={(route) => {
    setPendingRoute(route);
    setHubVisible(false);
  }}
/>

      {/* Dev Button */}
      <TouchableOpacity style={s.devBtn} onPress={() => router.push('/dev-menu')}>
        <Text style={s.devBtnText}>🛠️ Dev</Text>
      </TouchableOpacity>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── TOP BAR ── */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.push('/my-profile')}>
            <View style={s.avatar}><Text style={s.avatarText}>S</Text></View>
          </TouchableOpacity>
          <View style={s.greetingBlock}>
            <Text style={s.greeting}>{greeting}, Sofia! 👋</Text>
            <Text style={s.location}>📍 Manhattan, NY</Text>
          </View>
          <TouchableOpacity style={s.notifBtn} onPress={() => router.push('/notifications')}>
            <Text style={s.notifIcon}>🔔</Text>
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ── MODE TOGGLE ── */}
        <View style={s.modeToggle}>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'customer' && s.modeBtnActive]}
            onPress={() => setMode('customer')}>
            <Text style={[s.modeBtnText, mode === 'customer' && s.modeBtnTextActive]}>
              📋 Hire Someone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'worker' && s.modeBtnActive]}
            onPress={() => setMode('worker')}>
            <Text style={[s.modeBtnText, mode === 'worker' && s.modeBtnTextActive]}>
              💼 Find Work
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ONLINE TOGGLE ── */}
        {mode === 'worker' && (
          <TouchableOpacity
            style={[s.onlineToggle, isOnline && s.onlineToggleOn]}
            onPress={handleGoOnline} activeOpacity={0.85}>
            <View style={[s.onlineDot, { backgroundColor: isOnline ? '#4CAF7A' : '#555' }]} />
            <Text style={[s.onlineText, { color: isOnline ? '#4CAF7A' : '#888' }]}>
              {isOnline ? '● Online — You are visible' : '● Offline — Tap to go online'}
            </Text>
            <View style={[s.onlineSwitch, { backgroundColor: isOnline ? '#4CAF7A' : '#2A2A2E' }]}>
              <Animated.View style={[s.onlineThumb, {
                left: onlineAnim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }),
              }]} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── STATS BAR ── */}
        <Animated.View style={[s.statsBar, { opacity: statsAnim }]}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{mode === 'worker' ? '4' : '12'}</Text>
            <Text style={s.statLabel}>{mode === 'worker' ? 'Jobs Near' : 'Workers'}</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>🔴 6</Text>
            <Text style={s.statLabel}>Live Now</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>★ 4.9</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: isOnline ? '#4CAF7A' : '#888' }]}>
              {isOnline ? '🟢' : '⚫'}
            </Text>
            <Text style={s.statLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </Animated.View>

        {/* ── QUICK ACTIONS ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>⚡ Quick Actions</Text>
        </View>
        <View style={s.quickRow}>
          {quickActions.map(a => (
            <TouchableOpacity key={a.label} style={s.quickBtn}
              onPress={() => router.push(a.route as any)} activeOpacity={0.8}>
              <View style={[s.quickBox, { borderColor: a.color }]}>
                <Text style={s.quickIcon}>{a.icon}</Text>
              </View>
              <Text style={[s.quickLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GOLDEN DOLLAR HUB BUTTON ── */}
        <View style={s.hubTrigger}>
          <TouchableOpacity
            style={s.hubTriggerBtn}
            onPress={() => setHubVisible(true)}
            activeOpacity={0.85}
          >
            <GoldenDollar size="large" speed="slow" pulse={true} glow={true} />
          </TouchableOpacity>
          <Text style={s.hubTriggerLabel}>TAP TO EXPLORE ALL FEATURES</Text>
        </View>

        {/* ── XP BAR ── */}
        {mode === 'worker' && (
          <TouchableOpacity style={s.xpBar} onPress={() => router.push('/xp-levels')}>
            <Text style={s.xpLabel}>⚡ Trusted Expert</Text>
            <View style={s.xpBg}><View style={s.xpFill} /></View>
            <Text style={s.xpText}>2,450 XP</Text>
          </TouchableOpacity>
        )}

        {/* ── RECENT ACTIVITY ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>🕐 Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={s.sectionLink}>See all →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.activityCard}>
          {recentActivity.map((item, i) => (
            <View key={i} style={[s.activityRow, i < recentActivity.length - 1 && s.activityBorder]}>
              <View style={[s.activityDot, { backgroundColor: item.color }]} />
              <Text style={s.activityIcon}>{item.icon}</Text>
              <Text style={s.activityText}>{item.text}</Text>
              <Text style={s.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/explore')}>
          <Text style={s.bottomIcon}>🗺️</Text>
          <Text style={s.bottomText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/notifications')}>
          <Text style={s.bottomIcon}>🔔</Text>
          <Text style={s.bottomText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/my-profile')}>
          <Text style={s.bottomIcon}>👤</Text>
          <Text style={s.bottomText}>Profile</Text>
        </TouchableOpacity>
        {mode === 'worker' ? (
          <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/belt-system')}>
            <Text style={s.bottomIcon}>🥋</Text>
            <Text style={s.bottomText}>Belts</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/post-job')}>
            <Text style={s.bottomIcon}>➕</Text>
            <Text style={s.bottomText}>Post Job</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── HUB MODAL STYLES ──────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14,14,15,0.96)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 56, right: 20, zIndex: 100,
    backgroundColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  closeBtnText: { color: '#E8E8EA', fontSize: 13, fontWeight: '700' },
  hubHint: {
    position: 'absolute',
    top: 60, left: 0, right: 0,
    textAlign: 'center',
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spokeBtn: {
    width: 76, height: 76,
    backgroundColor: '#171719',
    borderWidth: 2, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  spokeIcon: { fontSize: 26 },
  spokeLabel: { fontSize: 10, fontWeight: '800' },
  subBtn: {
    width: 68, height: 68,
    backgroundColor: '#171719',
    borderWidth: 2, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  subIcon: { fontSize: 22 },
  subLabel: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  subHubBtn: {
    width: 92, height: 92,
    backgroundColor: '#1A1700',
    borderWidth: 3, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  subHubIcon: { fontSize: 30 },
  subHubName: { fontSize: 11, fontWeight: '800' },
  subHubBack: { fontSize: 9, color: '#555' },
  hubLabel: {
    fontSize: 10, fontWeight: '800',
    color: '#C9A84C', letterSpacing: 2,
    marginTop: 6, textAlign: 'center',
  },
});

// ── HOME SCREEN STYLES ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },
  scroll: { flex: 1 },

  devBtn: {
    position: 'absolute', top: 52, right: 20, zIndex: 999,
    backgroundColor: 'rgba(14,14,15,0.95)', borderWidth: 1,
    borderColor: '#2E2E33', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  location: { fontSize: 12, color: '#888', marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#C9A84C', borderWidth: 1, borderColor: '#0E0E0F',
  },

  modeToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 4, gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#C9A84C' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },
  modeBtnTextActive: { color: '#0E0E0F' },

  onlineToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 20, marginBottom: 10,
  },
  onlineToggleOn: {
    borderColor: 'rgba(76,175,122,0.4)',
    backgroundColor: 'rgba(76,175,122,0.06)',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineText: { fontSize: 13, fontWeight: '700', flex: 1 },
  onlineSwitch: { width: 46, height: 26, borderRadius: 13, position: 'relative' },
  onlineThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF',
    position: 'absolute', top: 3,
  },

  statsBar: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2E2E33',
    paddingVertical: 10, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 15, fontWeight: '800', color: '#C9A84C' },
  statLabel: { fontSize: 9, color: '#888' },
  statDiv: { width: 1, backgroundColor: '#2E2E33' },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  sectionLink: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },

  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  quickBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickBox: {
    width: 52, height: 52, backgroundColor: '#171719',
    borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  hubTrigger: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, marginBottom: 16,
  },
  hubTriggerBtn: { marginBottom: 10 },
  hubTriggerLabel: {
    fontSize: 10, fontWeight: '800',
    color: '#C9A84C', letterSpacing: 2,
  },

  xpBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 20, marginBottom: 16,
  },
  xpLabel: { fontSize: 11, color: '#C9A84C', fontWeight: '700' },
  xpBg: { flex: 1, height: 6, backgroundColor: '#2A2A2E', borderRadius: 3, overflow: 'hidden' },
  xpFill: { width: '49%', height: '100%', backgroundColor: '#C9A84C', borderRadius: 3 },
  xpText: { fontSize: 11, color: '#888' },

  activityCard: {
    marginHorizontal: 20, backgroundColor: '#171719',
    borderRadius: 16, borderWidth: 1, borderColor: '#2E2E33', overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#2E2E33' },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityIcon: { fontSize: 16 },
  activityText: { fontSize: 13, color: '#E8E8EA', flex: 1 },
  activityTime: { fontSize: 11, color: '#555', fontWeight: '600' },

  bottomBar: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderTopWidth: 1, borderTopColor: '#2E2E33',
    paddingVertical: 12, paddingBottom: 28,
  },
  bottomBtn: { flex: 1, alignItems: 'center', gap: 4 },
  bottomIcon: { fontSize: 22 },
  bottomText: { fontSize: 10, color: '#888', fontWeight: '600' },
});