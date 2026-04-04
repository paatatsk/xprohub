import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      { icon: '👤', label: 'Verify', route: '/verification', color: '#4A9EDB' },
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

const WORKER_ACTIVITY = [
  { icon: '💰', text: 'Job completed — Plumbing repair', time: '2h ago', color: '#4CAF7A' },
  { icon: '💰', text: '$85 payment received', time: '2h ago', color: '#C9A84C' },
  { icon: '⭐', text: 'New 5 star review from Sarah M.', time: '5h ago', color: '#C9A84C' },
];

const CUSTOMER_ACTIVITY = [
  { icon: '🔧', text: 'Worker arriving in 12 min', time: 'Now', color: '#4CAF7A' },
  { icon: '💬', text: 'New message from Mike T.', time: '30m ago', color: '#9B6EE8' },
  { icon: '🏠', text: 'Job confirmed — Cleaning', time: '1h ago', color: '#4CAF7A' },
];

function HubModal({ visible, mode, spokes, onClose, onNavigate }: {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={m.overlay}>
        <TouchableOpacity style={m.closeBtn} onPress={onClose}>
          <Text style={m.closeBtnText}>X Close</Text>
        </TouchableOpacity>

        <Text style={m.hubHint}>
          {hubLevel === 1 ? 'Tap a spoke to explore' : 'Tap an option to open it'}
        </Text>

        {hubLevel === 1 && spokes.map((spoke, i) => {
          const pos = getPos(spoke.angle, SPOKE_R);
          return (
            <Animated.View key={spoke.label} style={[m.node, {
              left: cx + pos.x - 38, top: cy + pos.y - 38,
              opacity: spokeAnim, transform: [{ scale: spokeAnim }],
            }]}>
              <TouchableOpacity
                style={[m.spokeBtn, { borderColor: spoke.color }]}
                onPress={() => openSubs(i)} activeOpacity={0.8}>
                <Text style={m.spokeIcon}>{spoke.icon}</Text>
                <Text style={[m.spokeLabel, { color: spoke.color }]}>{spoke.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {hubLevel === 2 && currentSpoke && (
          <>
            <TouchableOpacity
              style={[m.node, m.subHubBtn, { left: cx - 46, top: cy - 46, borderColor: currentSpoke.color }]}
              onPress={backToSpokes} activeOpacity={0.8}>
              <Text style={m.subHubIcon}>{currentSpoke.icon}</Text>
              <Text style={[m.subHubName, { color: currentSpoke.color }]}>{currentSpoke.label}</Text>
              <Text style={m.subHubBack}>back</Text>
            </TouchableOpacity>

            {currentSpoke.subs.map((sub, i) => {
              const total = currentSpoke.subs.length;
              const angle = -90 + i * (360 / total);
              const pos = getPos(angle, SUB_R);
              return (
                <TouchableOpacity key={sub.label}
                  style={[m.node, m.subBtn, {
                    left: cx + pos.x - 34, top: cy + pos.y - 34, borderColor: sub.color,
                  }]}
                  onPress={() => onNavigate(sub.route)} activeOpacity={0.8}>
                  <Text style={m.subIcon}>{sub.icon}</Text>
                  <Text style={[m.subLabel, { color: sub.color }]}>{sub.label}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

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

export default function HomeScreen() {
  const [mode, setMode] = useState<'worker' | 'customer'>('worker');
  const [greeting, setGreeting] = useState('');
  const [hubVisible, setHubVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const activity = mode === 'worker' ? WORKER_ACTIVITY : CUSTOMER_ACTIVITY;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="light" />

      <HubModal
        visible={hubVisible}
        mode={mode}
        spokes={mode === 'worker' ? SPOKES_WORKER : SPOKES_CUSTOMER}
        onClose={() => setHubVisible(false)}
        onNavigate={(route) => {
          setHubVisible(false);
          router.push(route as any);
        }}
      />

      <TouchableOpacity style={s.devBtn} onPress={() => router.push('/dev-menu')}>
        <Text style={s.devBtnText}>Dev</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.push('/my-profile')}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>S</Text>
            </View>
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

        <Animated.View style={[s.heroCard, { opacity: fadeAnim }]}>
          <View style={s.heroTop}>
            <View style={s.liveRow}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE MARKET</Text>
            </View>
            <Text style={s.heroJobCount}>6 jobs near you</Text>
          </View>

          <Animated.View style={[s.dollarWrap, { transform: [{ scale: pulseAnim }] }]}>
            <GoldenDollar size="large" speed="slow" pulse={true} glow={true} />
          </Animated.View>

          <Text style={s.heroSub}>
            {mode === 'worker'
              ? 'Real jobs. Real pay. Start earning now.'
              : 'Real workers. Real help. Get it done today.'}
          </Text>

          <TouchableOpacity
            style={s.heroBtn}
            onPress={() => router.push('/live-market')}
            activeOpacity={0.85}>
            <Text style={s.heroBtnText}>
              {mode === 'worker' ? 'Browse Jobs' : 'Find Workers'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionCard}
            onPress={() => router.push('/post-job')}
            activeOpacity={0.85}>
            <Text style={s.actionIcon}>📋</Text>
            <Text style={s.actionTitle}>Post a Job</Text>
            <Text style={s.actionSub}>Get help today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionCard}
            onPress={() => router.push('/worker-match')}
            activeOpacity={0.85}>
            <Text style={s.actionIcon}>👷</Text>
            <Text style={s.actionTitle}>Find a Worker</Text>
            <Text style={s.actionSub}>Browse available now</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.exploreBtn}
          onPress={() => setHubVisible(true)}
          activeOpacity={0.85}>
          <Text style={s.exploreBtnIcon}>💫</Text>
          <Text style={s.exploreBtnText}>Explore All Features</Text>
          <Text style={s.exploreBtnArrow}>→</Text>
        </TouchableOpacity>

        {mode === 'worker' && (
          <TouchableOpacity style={s.xpBar} onPress={() => router.push('/xp-levels')}>
            <Text style={s.xpLabel}>⚡ Trusted Expert</Text>
            <View style={s.xpBg}>
              <View style={s.xpFill} />
            </View>
            <Text style={s.xpText}>2,450 XP</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.bottomBtn} onPress={() => router.push('/live-market')}>
          <Text style={s.bottomIcon}>🔴</Text>
          <Text style={s.bottomText}>Live</Text>
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
    </SafeAreaView>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(14,14,15,0.96)', position: 'relative' },
  closeBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 100,
    backgroundColor: '#2E2E33', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  closeBtnText: { color: '#E8E8EA', fontSize: 13, fontWeight: '700' },
  hubHint: {
    position: 'absolute', top: 60, left: 0, right: 0,
    textAlign: 'center', color: '#C9A84C', fontSize: 12, fontWeight: '700', letterSpacing: 1,
  },
  node: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  spokeBtn: {
    width: 76, height: 76, backgroundColor: '#171719',
    borderWidth: 2, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  spokeIcon: { fontSize: 26 },
  spokeLabel: { fontSize: 10, fontWeight: '800' },
  subBtn: {
    width: 68, height: 68, backgroundColor: '#171719',
    borderWidth: 2, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  subIcon: { fontSize: 22 },
  subLabel: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  subHubBtn: {
    width: 92, height: 92, backgroundColor: '#1A1700',
    borderWidth: 3, borderRadius: 46, alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  subHubIcon: { fontSize: 30 },
  subHubName: { fontSize: 11, fontWeight: '800' },
  subHubBack: { fontSize: 9, color: '#555' },
  hubLabel: {
    fontSize: 10, fontWeight: '800', color: '#C9A84C',
    letterSpacing: 2, marginTop: 6, textAlign: 'center',
  },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  devBtn: {
    position: 'absolute', top: 52, right: 80, zIndex: 999,
    backgroundColor: 'rgba(14,14,15,0.95)', borderWidth: 1,
    borderColor: '#2E2E33', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  devBtnText: { color: '#888', fontSize: 12, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12,
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
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, padding: 4, gap: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#C9A84C' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },
  modeBtnTextActive: { color: '#0E0E0F' },

  heroCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#0F0E0A',
    borderWidth: 1, borderColor: '#C9A84C',
    borderRadius: 24, padding: 24,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  heroTop: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#FF3B30', letterSpacing: 1.5 },
  heroJobCount: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  dollarWrap: { marginBottom: 16 },
  heroSub: {
    fontSize: 14, color: '#888', textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  heroBtn: {
    backgroundColor: '#C9A84C', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  heroBtnText: { fontSize: 15, fontWeight: '800', color: '#0E0E0F' },

  actionRow: {
    flexDirection: 'row', marginHorizontal: 20,
    gap: 12, marginBottom: 16,
  },
  actionCard: {
    flex: 1, backgroundColor: '#171719',
    borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 18, padding: 18, alignItems: 'center', gap: 6,
  },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  actionSub: { fontSize: 11, color: '#888', textAlign: 'center' },

  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 8, marginBottom: 8,
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, gap: 8,
  },
  exploreBtnIcon: { fontSize: 18 },
  exploreBtnText: { fontSize: 14, fontWeight: '700', color: '#888', flex: 1, textAlign: 'center' },
  exploreBtnArrow: { fontSize: 16, color: '#C9A84C', fontWeight: '800' },

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

  bottomBar: {
    flexDirection: 'row', backgroundColor: '#171719',
    borderTopWidth: 1, borderTopColor: '#2E2E33',
    paddingVertical: 12, paddingBottom: 28,
  },
  bottomBtn: { flex: 1, alignItems: 'center', gap: 4 },
  bottomIcon: { fontSize: 22 },
  bottomText: { fontSize: 10, color: '#888', fontWeight: '600' },
});