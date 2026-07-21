import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Image, Keyboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useTrustLevel } from '../../hooks/useTrustLevel';
import { friendlyError } from '../../lib/moderation';

// Direct Hire v3 — charge-on-acceptance redesign
// Params: worker_id (uuid), worker_name (display string)
// Full job form pre-targeted at a specific worker.
// Backend: creates open targeted job + direct-offer bid (is_direct_offer=true).
// Worker sees offer in My Applications → accepts → hire-and-charge fires → matched.
// No charge at send time. Customer's card charged only when worker accepts.

type Timing = 'asap' | 'scheduled' | 'flexible';

interface WorkerSkill {
  task_id:       number;
  task_name:     string;
  price_min:     number;
  price_max:     number;
  is_featured:   boolean;
  category_name: string | null;
}

interface FormErrors {
  title?:        string;
  neighborhood?: string;
  tasks?:        string;
  price?:        string;
}

export default function DirectHireScreen() {
  const router = useRouter();
  const { worker_id, worker_name } = useLocalSearchParams<{
    worker_id:   string;
    worker_name: string;
  }>();

  const { trustLevel } = useTrustLevel();

  // Worker data
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null);
  const [skills, setSkills]           = useState<WorkerSkill[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [title, setTitle]               = useState('');
  const titleEdited                     = useRef(false);
  const [description, setDescription]   = useState('');
  const priceEdited                     = useRef(false);
  const [offerPrice, setOfferPrice]     = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [timing, setTiming]             = useState<Timing>('flexible');
  const [isUrgent, setIsUrgent]         = useState(false);

  // Self-hire guard
  const [isSelfHire, setIsSelfHire] = useState(false);

  // UI state
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load worker profile + skills ──────────────────────────────

  useEffect(() => {
    if (!worker_id) return;

    // Reset form state when navigating to a different worker
    setSelectedTaskIds(new Set());
    setTitle('');
    titleEdited.current = false;
    setDescription('');
    priceEdited.current = false;
    setOfferPrice('');
    setNeighborhood('');
    setTiming('flexible');
    setIsUrgent(false);
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);

    Promise.all([
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', worker_id)
        .single(),
      supabase
        .from('worker_skills')
        .select('task_id, is_featured, task_library ( name, price_min, price_max, task_categories ( name ) )')
        .eq('user_id', worker_id)
        .order('is_featured', { ascending: false }),
    ]).then(([profileRes, skillsRes]) => {
      if (profileRes.data) {
        setAvatarUrl(profileRes.data.avatar_url);
      }
      if (skillsRes.data) {
        const mapped: WorkerSkill[] = (skillsRes.data as any[])
          .map(row => ({
            task_id:       row.task_id,
            task_name:     row.task_library?.name                  ?? '',
            price_min:     row.task_library?.price_min             ?? 0,
            price_max:     row.task_library?.price_max             ?? 0,
            is_featured:   row.is_featured                         ?? false,
            category_name: row.task_library?.task_categories?.name ?? null,
          }))
          .filter(s => s.task_name !== '');
        setSkills(mapped);
      }
      setDataLoading(false);
    });
  }, [worker_id]);

  // ── Self-hire detection ────────────────────────────────────────

  useEffect(() => {
    if (!worker_id) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.id === worker_id) setIsSelfHire(true);
    });
  }, [worker_id]);

  // ── Form helpers ──────────────────────────────────────────────

  const autoFillFromSkills = useCallback((taskIds: Set<number>) => {
    const selected = skills.filter(s => taskIds.has(s.task_id));

    // Title
    if (!titleEdited.current) {
      if (selected.length === 0) {
        setTitle('');
      } else if (selected.length <= 2) {
        setTitle(selected.map(s => s.task_name).join(' & ').slice(0, 80));
      } else {
        setTitle(`${selected[0].task_name}, ${selected[1].task_name} +${selected.length - 2} more`.slice(0, 80));
      }
    }

    // Offer price — sum of selected skills' price_max
    if (!priceEdited.current) {
      if (selected.length === 0) {
        setOfferPrice('');
      } else {
        const sumMax = selected.reduce((s, sk) => s + sk.price_max, 0);
        setOfferPrice(String(sumMax));
      }
    }
  }, [skills]);

  const toggleTask = useCallback((id: number) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      autoFillFromSkills(next);
      return next;
    });
  }, [autoFillFromSkills]);

  const clearError = (key: keyof FormErrors) =>
    setErrors(e => ({ ...e, [key]: undefined }));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!title.trim())              e.title        = 'Job title is required';
    if (!neighborhood.trim())       e.neighborhood = 'Neighborhood is required';
    if (selectedTaskIds.size === 0) e.tasks        = 'Select at least one skill';
    const p = parseFloat(offerPrice);
    if (!offerPrice.trim() || isNaN(p) || p <= 0)
      e.price = 'Offer price is required';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('Session expired. Please sign in again.');
      return;
    }

    // Belt-and-suspenders trust-level gate (primary gate fires at market.tsx Hire button).
    // null trustLevel = still loading → allow through, no false-block.
    if (trustLevel === 'explorer') {
      const selfDest =
        `/(tabs)/direct-hire?worker_id=${worker_id}` +
        `&worker_name=${encodeURIComponent(worker_name ?? '')}`;
      router.replace(
        `/(onboarding)/verify-level-2?destination=${encodeURIComponent(selfDest)}` as Parameters<typeof router.replace>[0]
      );
      return;
    }

    // Payment method gate — customer must have card on file so the
    // off-session charge can succeed when the worker accepts.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_payment_method_added')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_payment_method_added) {
      const returnTo =
        `/(tabs)/direct-hire?worker_id=${worker_id}` +
        `&worker_name=${encodeURIComponent(worker_name ?? '')}`;
      router.push(
        `/(tabs)/payment-setup?returnTo=${encodeURIComponent(returnTo)}` as any
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Derive category from first selected task (for jobs.category column)
    const firstTaskId    = Array.from(selectedTaskIds)[0];
    const firstTask      = skills.find(s => s.task_id === firstTaskId);
    const categoryForJob = firstTask?.category_name ?? null;
    const price          = parseFloat(offerPrice);

    // 1. Create open targeted job (worker_id set → hidden from public feed by Slice 2 filters)
    const { data: jobId, error: rpcErr } = await supabase.rpc('create_job_with_tasks', {
      p_title:        title.trim(),
      p_description:  description.trim() || null,
      p_category:     categoryForJob,
      p_budget_min:   price,
      p_budget_max:   price,
      p_neighborhood: neighborhood.trim(),
      p_timing:       timing,
      p_is_urgent:    isUrgent,
      p_task_ids:     Array.from(selectedTaskIds),
      p_worker_id:    worker_id,
      p_status:       'open',
    });

    if (rpcErr || !jobId) {
      setSubmitError(friendlyError(rpcErr, 'Something went wrong creating this job. Please try again.'));
      setSubmitting(false);
      return;
    }

    // 2. INSERT direct-offer bid (customer inserts under Slice 1 RLS policy)
    const { error: bidErr } = await supabase
      .from('bids')
      .insert({
        job_id:          jobId,
        worker_id,
        proposed_price:  price,
        message:         'Direct hire request',
        is_direct_offer: true,
        status:          'pending',
      });

    if (bidErr) {
      // Clean up orphaned job — it's still 'open' so cancel_job works
      console.error('[direct-hire] Bid insert failed, cancelling orphan job:', bidErr.message);
      await supabase.rpc('cancel_job', { p_job_id: jobId }).catch(() => {});
      setSubmitError(friendlyError(bidErr, 'Something went wrong sending the request. Please try again.'));
      setSubmitting(false);
      return;
    }

    // 3. Success — no charge yet, no chat yet. Worker will see
    // the offer in My Applications and accept/decline from there.
    setSubmitting(false);
    Alert.alert(
      'Request Sent',
      `Your request has been sent to ${worker_name ?? 'the worker'}. You'll be charged only if they accept.`,
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/my-jobs' as any) }],
    );
  };

  // ── Derived ───────────────────────────────────────────────────

  const displayName      = worker_name ?? 'Worker';
  const initials         = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const superpowers      = skills.filter(s => s.is_featured).slice(0, 3);
  const isSubmitDisabled = submitting || selectedTaskIds.size === 0;

  // ── Guard: self-hire ───────────────────────────────────────────

  if (isSelfHire) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={{ fontSize: 36, marginBottom: 16 }}>🚧</Text>
          <Text style={[styles.label, { fontSize: 16, textAlign: 'center', letterSpacing: 2 }]}>
            CAN'T HIRE YOURSELF
          </Text>
          <Text style={{ fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            You can't create a job targeting yourself.
          </Text>
          <TouchableOpacity
            style={[styles.submitBtn, { marginTop: 24, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.gold }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitText, { color: Colors.gold }]}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ── Worker header strip ── */}
        <View style={styles.workerHeader}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.workerMeta}>
            <Text style={styles.hiringEyebrow}>HIRING</Text>
            <Text style={styles.workerName} numberOfLines={1}>{displayName}</Text>
            {superpowers.length > 0 && (
              <View style={styles.superpowerRow}>
                {superpowers.map(sp => (
                  <View key={sp.task_id} style={styles.spChip}>
                    <Text style={styles.spChipText} numberOfLines={1}>{sp.task_name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Skill picker (this worker's skills, multi-select) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            SKILL <Text style={styles.required}>*</Text>
          </Text>
          {skills.length === 0 ? (
            <Text style={styles.emptyText}>No skills listed for this worker.</Text>
          ) : (
            <View style={styles.chipWrap}>
              {skills.map(skill => {
                const active = selectedTaskIds.has(skill.task_id);
                return (
                  <TouchableOpacity
                    key={skill.task_id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => { toggleTask(skill.task_id); clearError('tasks'); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipName, active && styles.chipNameActive]}>
                      {skill.task_name}
                    </Text>
                    <Text style={[styles.chipPrice, active && styles.chipPriceActive]}>
                      ${skill.price_min}–${skill.price_max}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {errors.tasks && <Text style={styles.errorText}>{errors.tasks}</Text>}
        </View>

        {/* ── Title ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            JOB TITLE <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g. Deep clean 2BR apartment"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={t => { titleEdited.current = t.length > 0; setTitle(t.slice(0, 80)); clearError('title'); }}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <View style={styles.rowBetween}>
            {errors.title
              ? <Text style={styles.errorText}>{errors.title}</Text>
              : <View />}
            <Text style={styles.charCount}>{title.length}/80</Text>
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            DESCRIPTION <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Any extra details or special requirements..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={t => setDescription(t.slice(0, 500))}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={[styles.charCount, { textAlign: 'right' }]}>
            {description.length}/500
          </Text>
        </View>

        {/* ── Offer Price ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            OFFER PRICE <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceDollar}>$</Text>
            <TextInput
              style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={offerPrice}
              onChangeText={t => { priceEdited.current = true; setOfferPrice(t); clearError('price'); }}
              keyboardType="numeric"
            />
          </View>
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        {/* ── Neighborhood ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            NEIGHBORHOOD <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.neighborhood && styles.inputError]}
            placeholder="e.g. Brooklyn, Midtown, Astoria"
            placeholderTextColor={Colors.textSecondary}
            value={neighborhood}
            onChangeText={t => { setNeighborhood(t); clearError('neighborhood'); }}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {errors.neighborhood &&
            <Text style={styles.errorText}>{errors.neighborhood}</Text>}
        </View>

        {/* ── Timing ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>TIMING</Text>
          <View style={styles.timingRow}>
            {(['asap', 'scheduled', 'flexible'] as Timing[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timingBtn, timing === t && styles.timingBtnActive]}
                onPress={() => setTiming(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timingText, timing === t && styles.timingTextActive]}>
                  {t === 'asap' ? 'ASAP' : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Urgent toggle ── */}
        <View style={styles.fieldGroup}>
          <TouchableOpacity
            style={styles.urgentRow}
            onPress={() => setIsUrgent(u => !u)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.label}>URGENT</Text>
              <Text style={styles.urgentSub}>Appears in same-day feed</Text>
            </View>
            <View style={[styles.toggleTrack, isUrgent && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, isUrgent && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={Colors.background} />
            : <Text style={styles.submitText}>SEND REQUEST</Text>}
        </TouchableOpacity>

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Worker header strip
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar:         { width: 48, height: 48 },
  avatarFallback: {
    width: 48,
    height: 48,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: Colors.gold, fontWeight: 'bold', fontSize: 16 },
  workerMeta:     { flex: 1 },
  hiringEyebrow: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 2,
  },
  workerName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  superpowerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  spChip: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  spChipText: { color: Colors.gold, fontSize: 10, fontWeight: '600' },

  // Field group
  fieldGroup: { marginBottom: Spacing.lg },
  label: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  required: { color: Colors.red },
  optional: { color: Colors.textSecondary, fontWeight: 'normal' },

  // Task chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  chipActive:      { borderColor: Colors.gold, backgroundColor: Colors.gold + '22' },
  chipName:        { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  chipNameActive:  { color: Colors.gold },
  chipPrice:       { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 11 },
  chipPriceActive: { color: Colors.gold, opacity: 0.8 },
  emptyText:       { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },

  // Inputs
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  inputError:     { borderColor: Colors.red },

  // Helpers
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  charCount:  { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  errorText:  { fontFamily: Fonts.body, color: Colors.red, fontSize: 12, marginTop: 4 },

  // Price
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceDollar: { color: Colors.gold, fontWeight: 'bold', fontSize: 22 },
  priceInput: { flex: 1 },

  // Timing
  timingRow: { flexDirection: 'row', gap: 8 },
  timingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timingBtnActive:  { borderColor: Colors.gold, backgroundColor: 'rgba(201, 168, 76, 0.08)' },
  timingText:       { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  timingTextActive: { color: Colors.gold },

  // Urgent toggle
  urgentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  urgentSub: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn:  { backgroundColor: 'rgba(201, 168, 76, 0.15)', borderColor: Colors.gold },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.textSecondary,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { backgroundColor: Colors.gold, alignSelf: 'flex-end' },

  // Submit
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 2,
  },
  submitError: {
    fontFamily: Fonts.body,
    color: Colors.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
