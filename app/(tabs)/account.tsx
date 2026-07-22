// app/(tabs)/account.tsx
// Screen: ACCOUNT — Identity, About, Legal, Sign Out
// Entry point: gear icon on Home screen header

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing, Radius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useBiometrics } from '../../hooks/useBiometrics';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, SUPPORT_EMAIL } from '../../lib/legal';

export default function AccountScreen() {
  const router = useRouter();
  const { clearCredentials } = useBiometrics();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // ── Identity header data ──────────────────────────────────────
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ── Blocked users ──────────────────────────────────────────
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; blocked_id: string; full_name: string }[]>([]);

  const fetchAccountData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email ?? null);

    // Profile + blocked users in parallel
    const [profileRes, blocksRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single(),
      supabase
        .from('user_blocks')
        .select('id, blocked_id, profiles!blocked_id(full_name)')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setFullName(profileRes.data.full_name);
      setAvatarUrl(profileRes.data.avatar_url);
    }
    setBlockedUsers(
      (blocksRes.data ?? []).map((r: any) => ({
        id: r.id,
        blocked_id: r.blocked_id,
        full_name: r.profiles?.full_name ?? 'User',
      })),
    );
  }, []);

  useFocusEffect(useCallback(() => { fetchAccountData(); }, [fetchAccountData]));

  async function handleUnblock(blockId: string, name: string) {
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('id', blockId);
    if (error) {
      Alert.alert('Unblock Failed', "Couldn't unblock this user. Please try again.");
    } else {
      await fetchAccountData();
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await clearCredentials();
      router.replace('/(onboarding)/welcome');
    } catch (err) {
      Alert.alert('Sign Out Failed', 'Please check your connection and try again.');
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── IDENTITY HEADER ── */}
        <View style={styles.identityHeader}>
          <View style={styles.identityAvatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.identityAvatarImg} />
            ) : (
              <Text style={styles.identityInitials}>{initials}</Text>
            )}
          </View>
          {fullName && <Text style={styles.identityName}>{fullName}</Text>}
          {email && <Text style={styles.identityEmail}>{email}</Text>}
        </View>

        {/* ── ABOUT ── */}
        <Text style={styles.eyebrow}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Support</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValueGold}>{SUPPORT_EMAIL}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── LEGAL ── */}
        <Text style={styles.eyebrow}>LEGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => WebBrowser.openBrowserAsync(TERMS_OF_SERVICE_URL)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/community-guidelines' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Community Guidelines</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── ACTIONS ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => router.push('/delete-account' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteText}>DELETE ACCOUNT</Text>
        </TouchableOpacity>

        {/* ── BLOCKED USERS (footer section) ── */}
        <Text style={[styles.eyebrow, { marginTop: Spacing.xxl }]}>BLOCKED USERS</Text>
        <View style={styles.card}>
          {blockedUsers.length === 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowValue}>No blocked users</Text>
            </View>
          ) : (
            blockedUsers.map((block, i) => (
              <View key={block.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <Text style={styles.rowLabel} numberOfLines={1}>{block.full_name}</Text>
                  <TouchableOpacity
                    onPress={() => handleUnblock(block.id, block.full_name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.unblockText}>UNBLOCK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Identity header
  identityHeader: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
  },
  identityAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  identityAvatarImg: {
    width: 64,
    height: 64,
  },
  identityInitials: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 22,
  },
  identityName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  identityEmail: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },

  // Section eyebrow
  eyebrow: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },

  // Card container
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },

  // Card row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowLabel: {
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  unblockText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rowValue: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  rowValueGold: {
    fontFamily: Fonts.body,
    color: Colors.gold,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  // Delete Account button (below sign out, with separation)
  deleteBtn: {
    marginTop: 56,
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Sign Out button (first action after content)
  signOutBtn: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
