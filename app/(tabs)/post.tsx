import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// Screen 7 — Post a Job
// Step 4-FIX-2: Category-first task picker for HELP WANTED path.
//   - No catId → show category grid first, tap to drill into tasks
//   - With catId (from Home category card) → skip straight to tasks
// TODO Step 4C: Level 2 gate check before allowing submit

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

  // ── Back to categories (HELP WANTED path only — no catId) ──────────────
  const handleBackToCategories = useCallback(() => {
    setSelectedTaskIds(new Set());
    setTasks([]);
    setCategoryName(null);
    setCategorySlug(null);
    setViewMode('categories');
  }, []);

  const toggleTask = useCallback((id: number) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

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
      return; // TODO 4C: redirect to Level 2 gate here
    }

    setSubmitting(true);
    setSubmitError(null);

    const { data: newJob, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        customer_id:  user.id,
        title:        title.trim(),
        description:  description.trim() || null,
        category:     categoryName ?? null,
        budget_min:   budgetMin ? parseFloat(budgetMin) : null,
        budget_max:   budgetMax ? parseFloat(budgetMax) : null,
        neighborhood: neighborhood.trim(),
        timing,
        is_urgent:    isUrgent,
      })
      .select('id')
      .single();

    if (jobErr || !newJob) {
      setSubmitError(jobErr?.message ?? 'Failed to post job. Please try again.');
      setSubmitting(false);
      return;
    }

    const taskRows = Array.from(selectedTaskIds).map(task_id => ({
      job_post_id: newJob.id,
      task_id,
    }));

    const { error: tasksErr } = await supabase
      .from('job_post_tasks')
      .insert(taskRows);

    if (tasksErr) {
      setSubmitError('Job posted, but tasks failed to save. Contact support if this persists.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
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
            <Text style={styles.backLinkText}>← Change category</Text>
          </TouchableOpacity>
        )}

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
            onChangeText={t => { setTitle(t.slice(0, 80)); clearError('title'); }}
            maxLength={80}
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

        {/* ── Task chips ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            TASKS <Text style={styles.required}>*</Text>
          </Text>
          {tasksLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 12 }} />
          ) : (
            <View style={styles.chipWrap}>
              {tasks.map(task => {
                const active = selectedTaskIds.has(task.id);
                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => { toggleTask(task.id); clearError('tasks'); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipName, active && styles.chipNameActive]}>
                      {task.name}
                    </Text>
                    <Text style={[styles.chipPrice, active && styles.chipPriceActive]}>
                      ${task.price_min}–${task.price_max}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {errors.tasks && <Text style={styles.errorText}>{errors.tasks}</Text>}
        </View>

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
                onChangeText={t => { setBudgetMin(t); clearError('budget'); }}
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
                onChangeText={t => { setBudgetMax(t); clearError('budget'); }}
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
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  // Heading
  heading: {
    color: Colors.gold,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subhead: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },

  // Back link
  backLink: {
    marginBottom: Spacing.md,
    marginTop: -8,
  },
  backLinkText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },

  // Category grid
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
    color: Colors.textSecondary,
    fontSize: 11,
  },

  // Field group
  fieldGroup: { marginBottom: Spacing.lg },
  label: {
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
    fontSize: 15,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  inputError:     { borderColor: Colors.red },

  // Helpers
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  charCount:  { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  errorText:  { color: Colors.red, fontSize: 12, marginTop: 4 },

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
  chipPrice:       { color: Colors.textSecondary, fontSize: 11 },
  chipPriceActive: { color: Colors.gold, opacity: 0.8 },

  // Budget
  budgetRow:   { flexDirection: 'row', gap: 12 },
  budgetHalf:  { flex: 1 },
  budgetLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
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
  timingBtnActive:  { borderColor: Colors.gold, backgroundColor: Colors.gold },
  timingText:       { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  timingTextActive: { color: Colors.background },

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
  urgentSub:     { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
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
  toggleTrackOn:  { backgroundColor: Colors.gold, borderColor: Colors.gold },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.textSecondary,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { backgroundColor: Colors.background, alignSelf: 'flex-end' },

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
    color: Colors.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
