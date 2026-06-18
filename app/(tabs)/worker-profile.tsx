// app/(tabs)/worker-profile.tsx
// Read-only Worker Profile — the trust layer behind the Market pass card.
// Param: worker_id (uuid)

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image,
  FlatList, Dimensions, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Types ─────────────────────────────────────────────────────

interface WorkerProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  worker_status: string;
  jobs_completed: number;
  endorsement_count: number;
  today_rate_min: number | null;
  today_rate_max: number | null;
  city: string | null;
}

interface SkillRow {
  name: string;
  price_min: number | null;
  price_max: number | null;
  is_featured: boolean;
}

// ── Helpers ────────────────────────────────────────────────────

function statusDot(status: string): { color: string; label: string } {
  switch (status) {
    case 'available': return { color: Colors.green,         label: 'Available' };
    case 'booked':    return { color: Colors.amber,         label: 'Booked' };
    default:          return { color: Colors.textTertiary,  label: 'Offline' };
  }
}

function rateLabel(min: number | null, max: number | null): string | null {
  if (min && max) return `$${min} – $${max}`;
  if (min)        return `From $${min}`;
  if (max)        return `Up to $${max}`;
  return null;
}

function priceRange(min: number | null, max: number | null): string {
  if (min && max) return `$${min}–$${max}`;
  if (min)        return `$${min}+`;
  if (max)        return `≤$${max}`;
  return '';
}

// ── Screen ─────────────────────────────────────────────────────

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { worker_id } = useLocalSearchParams<{ worker_id: string }>();

  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [profile, setProfile]             = useState<WorkerProfile | null>(null);
  const [skills, setSkills]               = useState<SkillRow[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<{ url: string }[]>([]);
  const [credentials, setCredentials] = useState<{ url: string; type: string }[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setError(null);

    if (!worker_id) {
      setError('No worker specified.');
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // 1 — Profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, worker_status, jobs_completed, endorsement_count, today_rate_min, today_rate_max, city')
        .eq('id', worker_id)
        .single();

      if (profErr || !prof) {
        setError('Worker not found.');
        setLoading(false);
        return;
      }

      setProfile(prof as WorkerProfile);

      // 2 — Skills + portfolio + credentials (parallel)
      const [skillRes, portfolioRes, credentialRes] = await Promise.all([
        supabase
          .from('worker_skills')
          .select('is_featured, task_library ( name, price_min, price_max )')
          .eq('user_id', worker_id),
        supabase
          .from('worker_portfolio')
          .select('url')
          .eq('user_id', worker_id)
          .eq('type', 'photo')
          .order('sort_order')
          .order('created_at'),
        supabase
          .from('worker_portfolio')
          .select('url, type')
          .eq('user_id', worker_id)
          .in('type', ['certificate', 'reference'])
          .order('sort_order')
          .order('created_at'),
      ]);

      const skillData = skillRes.data;

      const rows: SkillRow[] = ((skillData ?? []) as any[]).map(r => ({
        name: r.task_library?.name ?? '',
        price_min: r.task_library?.price_min ?? null,
        price_max: r.task_library?.price_max ?? null,
        is_featured: !!r.is_featured,
      })).filter(r => r.name);

      // Superpowers first, then alphabetical
      rows.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setSkills(rows);
      setPortfolioPhotos((portfolioRes.data ?? []) as { url: string }[]);
      setCredentials((credentialRes.data ?? []) as { url: string; type: string }[]);
      setActivePhotoIndex(0);
      setFullscreenImage(null);
      setLoading(false);
    })();
  }, [worker_id]));

  // ── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.emptyGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>WORKER NOT FOUND</Text>
          <Text style={styles.emptySub}>{error ?? 'This profile may have been removed.'}</Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived ──────────────────────────────────────────────────

  const isSelf   = !!currentUserId && currentUserId === profile.id;
  const status   = statusDot(profile.worker_status);
  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const rate     = rateLabel(profile.today_rate_min, profile.today_rate_max);
  const superpowers = skills.filter(s => s.is_featured);
  const roster      = skills.filter(s => !s.is_featured);

  // ── JSX ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero: photo + name + status ── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                accessibilityLabel={`${profile.full_name}'s photo`}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.workerName}>{profile.full_name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={styles.statusLabel}>{status.label}</Text>
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.bioText}>
            {profile.bio || 'This worker hasn\u2019t added a bio yet.'}
          </Text>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.endorsement_count}</Text>
            <Text style={styles.statCaption}>ENDORSEMENTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.jobs_completed}</Text>
            <Text style={styles.statCaption}>JOBS DONE</Text>
          </View>
        </View>

        {/* ── Rate range ── */}
        {rate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RATE</Text>
            <Text style={styles.rateText}>{rate}</Text>
          </View>
        )}

        {/* ── Offers: superpowers + roster ── */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OFFERS</Text>

            {superpowers.length > 0 && (
              <View style={styles.skillGroup}>
                <Text style={styles.skillGroupLabel}>SUPERPOWERS</Text>
                {superpowers.map((s, i) => (
                  <View key={`sp_${i}`} style={styles.skillRow}>
                    <Text style={styles.skillNameFeatured}>{s.name}</Text>
                    {(s.price_min || s.price_max) ? (
                      <Text style={styles.skillPrice}>{priceRange(s.price_min, s.price_max)}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {roster.length > 0 && (
              <View style={styles.skillGroup}>
                {superpowers.length > 0 && (
                  <Text style={styles.skillGroupLabel}>ALSO OFFERS</Text>
                )}
                {roster.map((s, i) => (
                  <View key={`sk_${i}`} style={styles.skillRow}>
                    <Text style={styles.skillName}>{s.name}</Text>
                    {(s.price_min || s.price_max) ? (
                      <Text style={styles.skillPrice}>{priceRange(s.price_min, s.price_max)}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Empty skills state ── */}
        {skills.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>OFFERS</Text>
            <Text style={styles.emptySkills}>No skills listed yet.</Text>
          </View>
        )}

        {/* ── Portfolio photos ── */}
        {portfolioPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PORTFOLIO</Text>
            <View style={styles.portfolioSection}>
              <FlatList
                data={portfolioPhotos}
                keyExtractor={(_, i) => `port_${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - Spacing.md * 2));
                  setActivePhotoIndex(idx);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.url }}
                    style={[styles.portfolioImage, { width: SCREEN_WIDTH - Spacing.md * 2 }]}
                    accessibilityLabel="Portfolio photo"
                  />
                )}
              />
              {portfolioPhotos.length > 1 && (
                <View style={styles.portfolioDots}>
                  {portfolioPhotos.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.portfolioDot, i === activePhotoIndex && styles.portfolioDotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Credentials (certificates + references) ── */}
        {credentials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CREDENTIALS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.credentialStrip}
            >
              {credentials.map((cred, i) => (
                <TouchableOpacity
                  key={`cred_${i}`}
                  onPress={() => setFullscreenImage(cred.url)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${cred.type === 'certificate' ? 'Certificate' : 'Reference'}, tap to view full size`}
                  accessibilityRole="button"
                >
                  <Image
                    source={{ uri: cred.url }}
                    style={styles.credentialThumb}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Location ── */}
        {profile.city && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LOCATION</Text>
            <Text style={styles.locationText}>{profile.city}</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Fullscreen image modal ── */}
      <Modal visible={!!fullscreenImage} transparent animationType="fade">
        <Pressable
          style={styles.fullscreenOverlay}
          onPress={() => setFullscreenImage(null)}
          accessibilityLabel="Dismiss full-size image"
          accessibilityRole="button"
        >
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
              accessibilityLabel="Full-size credential"
            />
          )}
        </Pressable>
      </Modal>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        {isSelf ? (
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/my-card' as any)}
            accessibilityLabel="Edit your ID card"
            accessibilityRole="button"
          >
            <Text style={styles.editBtnText}>EDIT CARD</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.hireBtn}
            activeOpacity={0.85}
            onPress={() => router.push(
              `/(tabs)/direct-hire?worker_id=${profile.id}` +
              `&worker_name=${encodeURIComponent(profile.full_name)}` as any
            )}
            accessibilityLabel={`Hire ${profile.full_name}`}
            accessibilityRole="button"
          >
            <Text style={styles.hireBtnText}>HIRE {profile.full_name.split(' ')[0].toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: Spacing.xl,
  },

  // Empty / error
  emptyGlyph:   { fontSize: 36, marginBottom: 4 },
  emptyHeading: { fontFamily: Fonts.display, fontSize: 16, color: Colors.textPrimary, letterSpacing: 2 },
  emptySub:     { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  outlineBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  outlineBtnText: { fontFamily: Fonts.display, fontSize: 13, color: Colors.gold, letterSpacing: 2 },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.gold,
    marginBottom: Spacing.md,
  },
  avatarImage:    { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textSecondary },

  workerName: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 6,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },

  // Sections
  section: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionLabel: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },

  // Bio
  bioText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox:     { flex: 1, alignItems: 'center' },
  statNumber:  { fontFamily: Fonts.heading, fontSize: 28, color: Colors.gold },
  statCaption: { fontFamily: Fonts.display, fontSize: 9, color: Colors.textSecondary, letterSpacing: 1.5, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  // Rate
  rateText: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.gold },

  // Skills
  skillGroup:      { marginBottom: Spacing.md },
  skillGroupLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  skillNameFeatured: { fontFamily: Fonts.bodyMed, fontSize: 15, color: Colors.gold, flex: 1 },
  skillName:         { fontFamily: Fonts.body, fontSize: 15, color: Colors.textPrimary, flex: 1 },
  skillPrice:        { fontFamily: Fonts.mono, fontSize: 12, color: Colors.textSecondary, marginLeft: Spacing.sm },
  emptySkills:       { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },

  // Portfolio
  portfolioSection: { borderRadius: Radius.sm, overflow: 'hidden' },
  portfolioImage:   { height: 220, resizeMode: 'cover' as const },
  portfolioDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  portfolioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
  portfolioDotActive: { backgroundColor: Colors.gold },

  // Credentials
  credentialStrip: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  credentialThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Fullscreen image modal
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fullscreenImage: {
    width: SCREEN_WIDTH * 0.95,
    height: '90%' as any,
  },

  // Location
  locationText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textPrimary },

  // Footer
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  hireBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  hireBtnText: { fontFamily: Fonts.display, fontSize: 15, color: '#1A0F00', letterSpacing: 2 },
  editBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  editBtnText: { fontFamily: Fonts.display, fontSize: 15, color: Colors.gold, letterSpacing: 2 },
});
