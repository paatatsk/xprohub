import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, ActionSheetIOS,
  FlatList, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/moderation';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Job Detail — full job info + Apply CTA
// Params: job_id (uuid)

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  neighborhood: string | null;
  timing: string | null;
  is_urgent: boolean;
  created_at: string;
  customer_id: string | null;
  worker_id: string | null;
  status: string;
}

interface CustomerProfile {
  full_name: string | null;
  avatar_url: string | null;
}

// ── Helpers ────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function budgetLabel(min: number | null, max: number | null): string {
  if (min && max) return `$${min} – $${max}`;
  if (min)        return `From $${min}`;
  if (max)        return `Up to $${max}`;
  return 'Budget TBD';
}

function timingLabel(timing: string | null): string {
  if (timing === 'asap')      return 'ASAP';
  if (timing === 'scheduled') return 'Scheduled';
  if (timing === 'flexible')  return 'Flexible';
  return '—';
}

// ── Screen ─────────────────────────────────────────────────────

export default function JobDetailScreen() {
  const router     = useRouter();
  const { job_id } = useLocalSearchParams<{ job_id: string }>();

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [job, setJob]                       = useState<JobDetail | null>(null);
  const [customer, setCustomer]             = useState<CustomerProfile | null>(null);
  const [taskNames, setTaskNames]           = useState<string[]>([]);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [currentUserId, setCurrentUserId]   = useState<string | null>(null);
  const [photos, setPhotos]                 = useState<{ url: string }[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [cancelling, setCancelling]         = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setError(null);

    if (!job_id) {
      setError('No job specified.');
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // 1 — Load job row
      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('id, title, description, category, budget_min, budget_max, neighborhood, timing, is_urgent, created_at, customer_id, worker_id, status')
        .eq('id', job_id)
        .single();

      if (jobErr || !jobData) {
        setError('Job not found or no longer available.');
        setLoading(false);
        return;
      }

      setJob(jobData);

      // 2 — Parallel: customer profile + tasks + existing bid + listing photos
      const [profileRes, tasksRes, bidRes, photosRes] = await Promise.all([
        jobData.customer_id
          ? supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', jobData.customer_id)
              .single()
          : Promise.resolve({ data: null, error: null }),

        supabase
          .from('job_post_tasks')
          .select('task_library(name)')
          .eq('job_post_id', job_id),

        user
          ? supabase
              .from('bids')
              .select('id')
              .eq('job_id', job_id)
              .eq('worker_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),

        supabase
          .from('job_photos')
          .select('url')
          .eq('job_id', job_id)
          .eq('photo_type', 'listing')
          .order('sort_order', { ascending: true }),
      ]);

      setCustomer((profileRes as any).data ?? null);

      const names: string[] = ((tasksRes.data ?? []) as any[])
        .map(r => r.task_library?.name)
        .filter(Boolean);
      setTaskNames(names);

      setHasExistingBid(!!((bidRes as any).data));
      setPhotos(((photosRes as any).data ?? []) as { url: string }[]);
      setActivePhotoIndex(0);
      setLoading(false);
    })();
  }, [job_id]));

  // ── Close post handler (owner, open jobs only) ────────────────
  // Must live above early returns so hook count is constant.

  const handleClosePost = useCallback(() => {
    Alert.alert(
      'Close this posting?',
      "This removes it from the market and declines any pending applications. This can\u2019t be undone.",
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Close posting',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error: rpcErr } = await supabase.rpc('cancel_job', { p_job_id: job?.id ?? '' });
            if (rpcErr) {
              setCancelling(false);
              Alert.alert('Could not close', friendlyError(rpcErr, 'Something went wrong. Please try again.'));
              return;
            }
            router.back();
          },
        },
      ],
    );
  }, [job, router]);

  // ── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.emptyGlyph}>⚠️</Text>
          <Text style={styles.emptyHeading}>JOB NOT FOUND</Text>
          <Text style={styles.emptySub}>{error ?? 'This job may have been removed.'}</Text>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived ────────────────────────────────────────────────────

  const isOwnJob       = !!job.customer_id && !!currentUserId && job.customer_id === currentUserId;
  const isTargetedJob  = !!job.worker_id && job.worker_id !== currentUserId;
  const customerName   = customer?.full_name ?? 'Anonymous';
  const customerAvatar = customer?.avatar_url ?? null;
  const initials       = customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── JSX ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Listing photos ── */}
        {photos.length > 0 && (
          <View style={styles.photoSection}>
            <FlatList
              data={photos}
              keyExtractor={(_, i) => `photo_${i}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActivePhotoIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={styles.photoImage}
                  accessibilityLabel="Job listing photo"
                />
              )}
            />
            {photos.length > 1 && (
              <View style={styles.photoDots}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.photoDot, i === activePhotoIndex && styles.photoDotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Posted by strip ── */}
        <View style={styles.postedByRow}>
          {!isOwnJob && job.customer_id && (
            <TouchableOpacity
              style={styles.overflowBtn}
              accessibilityLabel="More options"
              accessibilityRole="button"
              onPress={() => {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    title: customerName,
                    options: ['Report Job', 'Cancel'],
                    cancelButtonIndex: 1,
                    userInterfaceStyle: 'dark',
                  },
                  (buttonIndex) => {
                    if (buttonIndex === 0) {
                      router.push(
                        `/(tabs)/report?reported_user_id=${job.customer_id}` +
                        `&content_type=job` +
                        `&content_id=${job.id}` +
                        `&reported_user_name=${encodeURIComponent(customerName)}` as any
                      );
                    }
                  },
                );
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.overflowIcon}>⋯</Text>
            </TouchableOpacity>
          )}
          <View style={styles.avatarWrap}>
            {customerAvatar ? (
              <Image source={{ uri: customerAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.postedByInfo}>
            <Text style={styles.postedByEyebrow}>POSTED BY</Text>
            <Text style={styles.postedByName} numberOfLines={1}>{customerName}</Text>
            <Text style={styles.postedByTime}>{timeAgo(job.created_at)}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>{job.title}</Text>

        {/* ── Category pill + urgent badge ── */}
        <View style={styles.pillRow}>
          {job.category ? (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{job.category.toUpperCase()}</Text>
            </View>
          ) : null}
          {job.is_urgent && (
            <View style={styles.urgentPill}>
              <Text style={styles.urgentPillText}>URGENT</Text>
            </View>
          )}
        </View>

        {/* ── Budget ── */}
        <Text style={styles.budget}>{budgetLabel(job.budget_min, job.budget_max)}</Text>

        {/* ── Description ── */}
        {job.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descText}>{job.description}</Text>
          </View>
        ) : null}

        {/* ── Tasks ── */}
        {taskNames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TASKS</Text>
            <View style={styles.chipRow}>
              {taskNames.map((name, i) => (
                <View key={i} style={styles.taskChip}>
                  <Text style={styles.taskChipText}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          {job.neighborhood ? (
            <Text style={styles.detailRow}>📍  {job.neighborhood}</Text>
          ) : null}
          {job.timing ? (
            <Text style={styles.detailRow}>⏰  {timingLabel(job.timing)}</Text>
          ) : null}
        </View>

      </ScrollView>

      {/* ── CTA footer ── */}
      <View style={styles.footer}>
        {isOwnJob ? (
          <View style={styles.ownerFooter}>
            <Text style={styles.ownJobText}>
              {job.status === 'cancelled' ? 'This posting has been closed.' : 'This is your job post'}
            </Text>
            {job.status === 'open' && (
              <TouchableOpacity
                style={styles.closePostBtn}
                onPress={handleClosePost}
                disabled={cancelling}
                activeOpacity={0.7}
                accessibilityLabel="Close this job posting"
                accessibilityRole="button"
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color={Colors.red} />
                ) : (
                  <Text style={styles.closePostText}>CLOSE THIS POSTING</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : hasExistingBid ? (
          <View style={[styles.applyBtn, styles.applyBtnSent]}>
            <Text style={styles.applyBtnSentText}>✓  APPLICATION SENT</Text>
          </View>
        ) : isTargetedJob ? (
          <View style={[styles.applyBtn, styles.applyBtnSent]}>
            <Text style={styles.applyBtnSentText}>NOT ACCEPTING APPLICATIONS</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/(tabs)/apply?job_id=${job.id}` as any)}
          >
            <Text style={styles.applyBtnText}>APPLY FOR THIS JOB</Text>
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
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: Spacing.xl,
  },

  // Listing photos
  photoSection: {
    marginHorizontal: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  photoImage: {
    width: SCREEN_WIDTH,
    height: 220,
    resizeMode: 'cover',
  },
  photoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  photoDotActive: {
    backgroundColor: Colors.gold,
  },

  // Error / empty states
  emptyGlyph: { fontSize: 40 },
  emptyHeading: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  emptySub: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  outlineBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },

  // Posted by strip
  postedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  overflowBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overflowIcon: {
    color: Colors.textSecondary,
    fontSize: 18,
    letterSpacing: 2,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar:         { width: 44, height: 44 },
  avatarFallback: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials:  { color: Colors.gold, fontWeight: 'bold', fontSize: 15 },
  postedByInfo:    { flex: 1 },
  postedByEyebrow: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  postedByName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  postedByTime: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  // Title
  title: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },

  // Pills row
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryPillText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  urgentPill: {
    borderWidth: 1.5,
    borderColor: Colors.red,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  urgentPillText: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Budget
  budget: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: Spacing.lg,
    letterSpacing: 0.5,
  },

  // Sections
  section:      { marginBottom: Spacing.lg },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  descText: {
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },

  // Task chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskChip: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  taskChipText: { color: Colors.gold, fontSize: 12, fontWeight: '600' },

  // Details
  detailRow: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Footer CTA
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  applyBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyBtnSent: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.green,
  },
  applyBtnText:     { color: Colors.background, fontWeight: 'bold', fontSize: 14, letterSpacing: 2 },
  applyBtnSentText: { color: Colors.green,      fontWeight: 'bold', fontSize: 14, letterSpacing: 1.5 },
  ownJobText: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ownerFooter: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  closePostBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  closePostText: {
    color: Colors.red,
    fontFamily: Fonts.body,
    fontSize: 12,
    letterSpacing: 1,
  },
});
