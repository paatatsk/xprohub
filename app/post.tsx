import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Image, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { uploadJobPhoto } from '../lib/photos';
import { friendlyError } from '../lib/moderation';

// Screen 7 — Post a Job
// Step 4-FIX-2: Category-first task picker for HELP WANTED path.
//   - No catId → show category grid first, tap to drill into tasks
//   - With catId (from Home category card) → skip straight to tasks
// D-5: Payment method gate fires at handleSubmit (not load)

type Timing   = 'asap' | 'scheduled' | 'flexible';
type ViewMode = 'categories' | 'tasks';

interface Category {
  id: number;
  name: string;
  icon_slug: string;
}

interface Task {
  id: number;
  name: string;
  price_min: number;
  price_max: number;
}

interface FormErrors {
  title?:        string;
  neighborhood?: string;
  tasks?:        string;
  budget?:       string;
}

function iconForSlug(slug: string): string {
  const map: Record<string, string> = {
    'home-cleaning':    '🧹',
    'errands-delivery': '📦',
    'pet-care':         '🐾',
    'child-care':       '👶',
    'elder-care':       '🧓',
    'moving-labor':     '🚚',
    'tutoring':         '📚',
    'coaching':         '🏆',
    'personal-asst':    '🗂️',
    'vehicle-care':     '🚗',
    'handyman':         '🔨',
    'gardening':        '🌿',
    'trash-recycling':  '♻️',
    'events':           '🎉',
    'electrical':       '⚡',
    'plumbing':         '🔧',
    'painting':         '🎨',
    'carpentry':        '🪚',
    'it-tech':          '💻',
    'hvac':             '❄️',
  };
  return map[slug] ?? '▪';
}

export default function PostScreen() {
  const router = useRouter();
  const { category_id } = useLocalSearchParams<{ category_id?: string }>();
  const catId = category_id ? parseInt(category_id, 10) : null;

  // View mode — jump to tasks if catId was passed in
  const [viewMode, setViewMode] = useState<ViewMode>(catId ? 'tasks' : 'categories');

  // Category picker state
  const [categories, setCategories]     = useState<Category[]>([]);
  const [taskCounts, setTaskCounts]     = useState<Record<number, number>>({});
  const [catsLoading, setCatsLoading]   = useState(!catId); // only load if starting on categories

  // Selected category meta
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  // Task picker state
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(catId !== null); // load immediately if catId given
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());

  // Form fields
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [budgetMin, setBudgetMin]       = useState('');
  const [budgetMax, setBudgetMax]       = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [timing, setTiming]             = useState<Timing>('flexible');
  const [isUrgent, setIsUrgent]         = useState(false);

  // Photos — local URIs selected before job creation (uploaded after RPC)
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  // Track whether the user has manually edited each auto-filled field.
  // Once edited, auto-fill stops updating that field — user input always wins.
  const titleEdited       = useRef(false);
  const descriptionEdited = useRef(false);
  const budgetEdited      = useRef(false);

  // UI state
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load categories + task counts (HELP WANTED path only) ──────────────
  useEffect(() => {
    if (catId) return; // skip — starting in tasks view

    supabase
      .from('task_categories')
      .select('id, name, icon_slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setCategories(data ?? []);
        setCatsLoading(false);
      });

    // Build task count map: fetch category_id for all active tasks
    supabase
      .from('task_library')
      .select('category_id')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<number, number> = {};
        for (const row of data) {
          counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
        }
        setTaskCounts(counts);
      });
  }, [catId]);

  // ── Load tasks when catId is passed directly from Home ─────────────────
  useEffect(() => {
    if (!catId) return; // handled by handleCategorySelect instead

    supabase
      .from('task_library')
      .select('id, name, price_min, price_max')
      .eq('is_active', true)
      .eq('category_id', catId)
      .order('task_code', { ascending: true })
      .then(({ data }) => {
        setTasks(data ?? []);
        setTasksLoading(false);
      });

    supabase
      .from('task_categories')
      .select('name, icon_slug')
      .eq('id', catId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCategoryName(data.name);
          setCategorySlug(data.icon_slug);
        }
      });
  }, [catId]);

  // ── Category tile tapped → drill into tasks ─────────────────────────────
  const handleCategorySelect = useCallback(async (cat: Category) => {
    setCategoryName(cat.name);
    setCategorySlug(cat.icon_slug);
    setTasksLoading(true);
    setViewMode('tasks');

    const { data } = await supabase
      .from('task_library')
      .select('id, name, price_min, price_max')
      .eq('is_active', true)
      .eq('category_id', cat.id)
      .order('task_code', { ascending: true });

    setTasks(data ?? []);
    setTasksLoading(false);
  }, []);

  // ── Photo picker ───────────────────────────────────────────────────────
  const pickPhoto = useCallback(async () => {
    if (photoUris.length >= 3) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSubmitError('Photo library permission is needed to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUris(prev => [...prev, result.assets[0].uri]);
    }
  }, [photoUris.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Auto-fill from selected tasks ──────────────────────────────────────
  const autoFillFromTasks = useCallback((taskIds: Set<number>) => {
    const selected = tasks.filter(t => taskIds.has(t.id));

    // Title — generate readable name from selected tasks
    if (!titleEdited.current) {
      if (selected.length === 0) {
        setTitle('');
      } else if (selected.length <= 2) {
        setTitle(selected.map(t => t.name).join(' & '));
      } else {
        setTitle(`${selected[0].name}, ${selected[1].name} +${selected.length - 2} more`);
      }
    }

    // Description — scaffold from task names
    if (!descriptionEdited.current) {
      if (selected.length === 0) {
        setDescription('');
      } else {
        setDescription(`Looking for help with: ${selected.map(t => t.name).join(', ')}.`);
      }
    }

    // Budget — sum of price ranges
    if (!budgetEdited.current) {
      if (selected.length === 0) {
        setBudgetMin('');
        setBudgetMax('');
      } else {
        const sumMin = selected.reduce((s, t) => s + t.price_min, 0);
        const sumMax = selected.reduce((s, t) => s + t.price_max, 0);
        setBudgetMin(String(sumMin));
        setBudgetMax(String(sumMax));
      }
    }
  }, [tasks]);

  // ── Reset form to clean slate ─────────────────────────────────────────
  const resetForm = useCallback(() => {
    setViewMode(catId ? 'tasks' : 'categories');
    setSelectedTaskIds(new Set());
    if (!catId) {
      setTasks([]);
      setCategoryName(null);
      setCategorySlug(null);
    }
    setTitle('');
    setDescription('');
    setBudgetMin('');
    setBudgetMax('');
    setNeighborhood('');
    setTiming('flexible');
    setIsUrgent(false);
    setPhotoUris([]);
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);
    titleEdited.current = false;
    descriptionEdited.current = false;
    budgetEdited.current = false;
  }, [catId]);

  // ── Back to categories (HELP WANTED path only — no catId) ──────────────
  const handleBackToCategories = useCallback(() => {
    setSelectedTaskIds(new Set());
    setTasks([]);
    setCategoryName(null);
    setCategorySlug(null);
    setViewMode('categories');
    setTitle('');
    setDescription('');
    setBudgetMin('');
    setBudgetMax('');
    setPhotoUris([]);
    titleEdited.current = false;
    descriptionEdited.current = false;
    budgetEdited.current = false;
  }, []);

  const toggleTask = useCallback((id: number) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      autoFillFromTasks(next);
      return next;
    });
  }, [autoFillFromTasks]);

  const clearError = (key: keyof FormErrors) =>
    setErrors(e => ({ ...e, [key]: undefined }));

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (viewMode === 'categories') {
      e.tasks = 'Please choose a category first';
      return e;
    }
    if (!title.trim())        e.title = 'Job title is required';
    if (!neighborhood.trim()) e.neighborhood = 'Neighborhood is required';
    if (selectedTaskIds.size === 0) e.tasks = 'Select at least one task';
    const mn = parseFloat(budgetMin), mx = parseFloat(budgetMax);
    if (budgetMin && budgetMax && !isNaN(mn) && !isNaN(mx) && mn > mx)
      e.budget = 'Min budget cannot exceed max budget';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('You must be logged in to post a job.');
      return;
    }

    // Customer identity + payment method gates — check before INSERT
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, stripe_payment_method_added')
      .eq('id', user.id)
      .single();

    // Identity gate — name + photo required to post jobs
    if (!profile?.full_name || !profile?.avatar_url) {
      router.push(
        `/(onboarding)/profile-setup?mode=gate&returnTo=${encodeURIComponent('/post')}` as any
      );
      return;
    }

    // Payment method gate (D-5)
    if (!profile?.stripe_payment_method_added) {
      router.push(
        `/payment-setup?returnTo=${encodeURIComponent('/post')}` as any
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Atomic job + tasks creation — no orphaned taskless jobs possible
    const { data: jobId, error: rpcErr } = await supabase.rpc('create_job_with_tasks', {
      p_title:        title.trim(),
      p_description:  description.trim() || null,
      p_category:     categoryName ?? null,
      p_budget_min:   budgetMin ? parseFloat(budgetMin) : null,
      p_budget_max:   budgetMax ? parseFloat(budgetMax) : null,
      p_neighborhood: neighborhood.trim(),
      p_timing:       timing,
      p_is_urgent:    isUrgent,
      p_task_ids:     Array.from(selectedTaskIds),
    });

    if (rpcErr || !jobId) {
      setSubmitError(friendlyError(rpcErr, 'Something went wrong posting your job. Please try again.'));
      setSubmitting(false);
      return;
    }

    // Upload photos (non-blocking — job is already created)
    if (photoUris.length > 0) {
      const userId = user.id;
      for (let i = 0; i < photoUris.length; i++) {
        try {
          const { url } = await uploadJobPhoto(jobId, 'listing', photoUris[i]);
          await supabase.from('job_photos').insert({
            job_id: jobId,
            url,
            photo_type: 'listing',
            uploaded_by: userId,
            sort_order: i,
          });
        } catch (err: any) {
          // Photo upload failed — log for diagnosis but don't block the post
          console.error(`[post] Photo ${i + 1} upload failed:`, err?.message ?? err);
        }
      }
    }

    setSubmitting(false);
    resetForm();
    router.replace('/(tabs)/market');
  };

  // ── Category emoji for subhead ──────────────────────────────────────────
  const categoryEmoji = categorySlug ? iconForSlug(categorySlug) : null;

  // ── RENDER: Category grid ───────────────────────────────────────────────
  if (viewMode === 'categories') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>CHOOSE A CATEGORY</Text>
          <Text style={styles.subhead}>What kind of help do you need?</Text>

          {catsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.catGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catTile}
                  onPress={() => handleCategorySelect(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.catEmoji}>{iconForSlug(cat.icon_slug)}</Text>
                  <Text style={styles.catName}>{cat.name.toUpperCase()}</Text>
                  {taskCounts[cat.id] !== undefined && (
                    <Text style={styles.catCount}>
                      {taskCounts[cat.id]} task{taskCounts[cat.id] !== 1 ? 's' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RENDER: Task picker + form ──────────────────────────────────────────
  const isSubmitDisabled = submitting || selectedTaskIds.size === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ── Heading + category context ── */}
        <Text style={styles.heading}>POST A JOB</Text>
        <Text style={styles.subhead}>
          {categoryEmoji && categoryName
            ? `${categoryEmoji}  ${categoryName}`
            : 'Fill in the details below'}
        </Text>

        {/* ── Back to categories (only on HELP WANTED path) ── */}
        {!catId && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={handleBackToCategories}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>{'\u2190'} Change category</Text>
          </TouchableOpacity>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 1 — DESCRIBE YOUR JOB
           ════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionLabel}>DESCRIBE YOUR JOB</Text>

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

        {/* ── Photos (optional, up to 3) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            PHOTO <Text style={styles.optional}>(optional — helps workers respond faster)</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}
          >
            {photoUris.map((uri, i) => (
              <View key={uri} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => removePhoto(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove photo ${i + 1}`}
                >
                  <Text style={styles.photoRemoveText}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photoUris.length < 3 && (
              <TouchableOpacity
                style={styles.photoAdd}
                onPress={pickPhoto}
                activeOpacity={0.7}
                accessibilityLabel="Add photo"
                accessibilityRole="button"
              >
                <Text style={styles.photoAddIcon}>+</Text>
                <Text style={styles.photoAddLabel}>ADD{'\n'}PHOTO</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
            onChangeText={t => { descriptionEdited.current = true; setDescription(t.slice(0, 500)); }}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={[styles.charCount, { textAlign: 'right' }]}>
            {description.length}/500
          </Text>
        </View>

        {/* ── Section divider ── */}
        <View style={styles.sectionDivider} />

        {/* ════════════════════════════════════════════════════════
            SECTION 2 — SELECT TASKS
           ════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionLabel}>SELECT TASKS</Text>

        {tasksLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.taskBox}>
            {tasks.map((task, i) => {
              const active = selectedTaskIds.has(task.id);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskRow, i > 0 && styles.taskRowDivider]}
                  onPress={() => { toggleTask(task.id); clearError('tasks'); }}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                  </View>
                  <Text style={[styles.taskName, active && styles.taskNameActive]} numberOfLines={1}>
                    {task.name}
                  </Text>
                  <Text style={[styles.taskPrice, active && styles.taskPriceActive]}>
                    ${task.price_min}{'\u2013'}${task.price_max}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Text style={[styles.taskCount, selectedTaskIds.size > 0 && styles.taskCountActive]}>
          {selectedTaskIds.size} {selectedTaskIds.size === 1 ? 'task' : 'tasks'} selected
        </Text>
        {errors.tasks && <Text style={styles.errorText}>{errors.tasks}</Text>}

        {/* ── Section divider ── */}
        <View style={styles.sectionDivider} />

        {/* ════════════════════════════════════════════════════════
            SECTION 3 — DETAILS
           ════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionLabel}>DETAILS</Text>

        {/* ── Budget ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            BUDGET <Text style={styles.optional}>(optional)</Text>
          </Text>
          <View style={styles.budgetRow}>
            <View style={styles.budgetHalf}>
              <Text style={styles.budgetLabel}>MIN $</Text>
              <TextInput
                style={[styles.input, errors.budget && styles.inputError]}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                value={budgetMin}
                onChangeText={t => { budgetEdited.current = true; setBudgetMin(t); clearError('budget'); }}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.budgetHalf}>
              <Text style={styles.budgetLabel}>MAX $</Text>
              <TextInput
                style={[styles.input, errors.budget && styles.inputError]}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                value={budgetMax}
                onChangeText={t => { budgetEdited.current = true; setBudgetMax(t); clearError('budget'); }}
                keyboardType="numeric"
              />
            </View>
          </View>
          {errors.budget && <Text style={styles.errorText}>{errors.budget}</Text>}
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
          activeOpacity={0.85}
          disabled={isSubmitDisabled}
        >
          {submitting
            ? <ActivityIndicator color={Colors.background} />
            : <Text style={styles.submitText}>POST JOB</Text>
          }
        </TouchableOpacity>

        {submitError && (
          <Text style={styles.submitError}>{submitError}</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },

  // Heading
  heading: {
    fontFamily: Fonts.heading,
    color: Colors.gold,
    fontSize: 34,
    letterSpacing: 2,
    marginBottom: 6,
  },
  subhead: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },

  // Back link
  backLink: {
    marginBottom: 20,
  },
  backLinkText: {
    color: Colors.gold,
    fontFamily: Fonts.bodyMed,
    fontSize: 13,
  },

  // Section structure
  sectionLabel: {
    fontFamily: Fonts.display,
    fontSize: 10,
    letterSpacing: 4,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },

  // Category grid (categories view)
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  catTile: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: 6,
  },
  catEmoji: {
    fontSize: 28,
  },
  catName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  catCount: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 11,
  },

  // Field group
  fieldGroup: { marginBottom: 20 },
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

  // Inputs
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  inputError:     { borderColor: Colors.red },

  // Photo picker
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: 80,
    height: 80,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddIcon: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.gold,
    marginTop: -2,
  },
  photoAddLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.gold,
    textAlign: 'center',
  },

  // Helpers
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  charCount:  { fontFamily: Fonts.mono, color: Colors.textSecondary, fontSize: 10, marginTop: 4 },
  errorText:  { fontFamily: Fonts.body, color: Colors.red, fontSize: 12, marginTop: 6 },

  // Task selector (contained box)
  taskBox: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 48,
  },
  taskRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: -1,
  },
  taskName: {
    flex: 1,
    fontFamily: Fonts.bodyMed,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  taskNameActive: {
    color: Colors.gold,
  },
  taskPrice: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  taskPriceActive: {
    color: Colors.gold,
  },
  taskCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  taskCountActive: {
    color: Colors.gold,
  },

  // Budget
  budgetRow:   { flexDirection: 'row', gap: 12 },
  budgetHalf:  { flex: 1 },
  budgetLabel: {
    fontFamily: Fonts.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
  },

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
  timingText:       { fontFamily: Fonts.bodyMed, color: Colors.textSecondary, fontSize: 12 },
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
    marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    color: Colors.background,
    fontFamily: Fonts.heading,
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
