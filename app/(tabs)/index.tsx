import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoldenDollar from '../../components/GoldenDollar';

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

export default function HomeScreen() {
  const [mode, setMode] = useState<'worker' | 'customer'>('worker');
  const [greeting, setGreeting] = useState('');
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

        {mode === 'worker' && (
          <TouchableOpacity style={s.xpBar} onPress={() => router.push('/xp-levels')}>
            <Text style={s.xpLabel}>⚡ Trusted Expert</Text>
            <View style={s.xpBg}>
              <View style={s.xpFill} />
            </View>
            <Text style={s.xpText}>2,450 XP</Text>
          </TouchableOpacity>
        )}

        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>🕐 Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={s.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={s.activityCard}>
          {activity.map((item, i) => (
            <View
              key={i}
              style={[s.activityRow, i < activity.length - 1 && s.activityBorder]}>
              <View style={[s.activityDot, { backgroundColor: item.color }]} />
              <Text style={s.activityIcon}>{item.icon}</Text>
              <Text style={s.activityText}>{item.text}</Text>
              <Text style={s.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>

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

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#E8E8EA' },
  sectionLink: { fontSize: 12, color: '#C9A84C', fontWeight: '600' },

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