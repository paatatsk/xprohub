import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';

const CATEGORIES = [
  { icon: '🧹', name: 'Cleaning', tasks: ['Deep Clean', 'Regular Clean', 'Move-In/Out', 'Post-Party'] },
  { icon: '📦', name: 'Errands', tasks: ['Grocery Shopping', 'Package Delivery', 'Pharmacy Run', 'Post Office'] },
  { icon: '🐾', name: 'Pet Care', tasks: ['Dog Walking', 'Pet Sitting', 'Feeding', 'Grooming'] },
  { icon: '👶', name: 'Child Care', tasks: ['Babysitting', 'After School', 'Overnight', 'School Pickup'] },
  { icon: '📚', name: 'Tutoring', tasks: ['Math', 'Reading', 'Science', 'SAT Prep'] },
  { icon: '🏆', name: 'Sports', tasks: ['Tennis', 'Soccer', 'Swimming', 'Running Coach'] },
  { icon: '🍽️', name: 'Catering', tasks: ['Private Chef', 'Meal Prep', 'Event Catering', 'Bartending'] },
  { icon: '🎭', name: 'Entertainment', tasks: ['Photographer', 'DJ', 'Musician', 'MC/Host'] },
  { icon: '🚗', name: 'Vehicle', tasks: ['Car Wash', 'Detailing', 'Airport Drop', 'Snow Clear'] },
  { icon: '📦', name: 'Moving', tasks: ['Loading', 'Furniture Move', 'Packing', 'Junk Removal'] },
  { icon: '⚡', name: 'Electrical', tasks: ['Outlet Repair', 'Light Fixtures', 'Smart Home', 'Ceiling Fan'] },
  { icon: '🔧', name: 'Plumbing', tasks: ['Leaky Faucet', 'Drain Unclog', 'Toilet Repair', 'Pipe Fix'] },
  { icon: '🎨', name: 'Painting', tasks: ['Interior', 'Exterior', 'Touch Up', 'Cabinet Paint'] },
  { icon: '🪚', name: 'Carpentry', tasks: ['Furniture Fix', 'Shelves', 'Door Repair', 'Deck Build'] },
  { icon: '💻', name: 'IT & Tech', tasks: ['Computer Fix', 'WiFi Setup', 'TV Mounting', 'Smart Home'] },
  { icon: '❄️', name: 'HVAC', tasks: ['AC Service', 'Filter Change', 'Furnace Check', 'Thermostat'] },
];

const TIMING = ['ASAP', 'Today', 'Tomorrow', 'Schedule'];

export default function PostJobScreen() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [budget, setBudget] = useState(50);
  const [timing, setTiming] = useState('ASAP');
  const [notes, setNotes] = useState('');

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setStep(3);
  };

  const handlePost = () => {
    router.push('/job-posted');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'What do you need?' :
           step === 2 ? selectedCategory?.name :
           'Job Details'}
        </Text>
        <Text style={styles.stepIndicator}>{step}/3</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      {/* STEP 1 — Category Selection */}
      {step === 1 && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Choose a category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.categoryTile}
                onPress={() => handleCategorySelect(cat)}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* STEP 2 — Task Selection */}
      {step === 2 && selectedCategory && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>What specifically?</Text>
          <View style={styles.taskList}>
            {selectedCategory.tasks.map((task) => (
              <TouchableOpacity
                key={task}
                style={styles.taskItem}
                onPress={() => handleTaskSelect(task)}>
                <Text style={styles.taskIcon}>{selectedCategory.icon}</Text>
                <Text style={styles.taskName}>{task}</Text>
                <Text style={styles.taskArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* STEP 3 — Job Details */}
      {step === 3 && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Selected Job Summary */}
          <View style={styles.jobSummary}>
            <Text style={styles.jobSummaryIcon}>{selectedCategory?.icon}</Text>
            <View style={styles.jobSummaryText}>
              <Text style={styles.jobSummaryTitle}>{selectedTask}</Text>
              <Text style={styles.jobSummaryCat}>{selectedCategory?.name}</Text>
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR BUDGET</Text>
            <View style={styles.budgetRow}>
              <TouchableOpacity
                style={styles.budgetBtn}
                onPress={() => setBudget(Math.max(20, budget - 10))}>
                <Text style={styles.budgetBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.budgetAmount}>${budget}</Text>
              <TouchableOpacity
                style={styles.budgetBtn}
                onPress={() => setBudget(budget + 10)}>
                <Text style={styles.budgetBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.budgetHint}>Typical range for this job: $40–$120</Text>
          </View>

          {/* Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHEN DO YOU NEED IT?</Text>
            <View style={styles.timingRow}>
              {TIMING.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timingBtn, timing === t && styles.timingBtnActive]}
                  onPress={() => setTiming(t)}>
                  <Text style={[styles.timingText, timing === t && styles.timingTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADD PHOTOS (OPTIONAL)</Text>
            <TouchableOpacity style={styles.photoUpload}>
              <Text style={styles.photoIcon}>📸</Text>
              <Text style={styles.photoText}>Tap to add photos</Text>
              <Text style={styles.photoHint}>Help workers understand the job</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SPECIAL REQUIREMENTS</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Bring own supplies, pet-friendly products, 2BR apartment..."
              placeholderTextColor="#444450"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
<View style={{ alignItems: 'center', marginBottom: 12 }}>
  <GoldenDollar size="small" speed="slow" pulse={true} glow={true} />
</View>
          {/* Post Button */}
          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>Find Workers Near Me 🔍</Text>
            <Text style={styles.postButtonSub}>
              Budget ${budget} · {timing} · Manhattan, NY
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    color: '#888890',
    fontSize: 16,
  },
  headerTitle: {
    color: '#E8E8EA',
    fontSize: 17,
    fontWeight: '700',
  },
  stepIndicator: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '700',
  },

  // Progress
  progressBar: {
    height: 3,
    backgroundColor: '#2A2A2E',
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 2,
  },

  scroll: { flex: 1 },

  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8E8EA',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryTile: {
    width: '30%',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: { fontSize: 28 },
  categoryName: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Task List
  taskList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  taskIcon: { fontSize: 22 },
  taskName: {
    flex: 1,
    fontSize: 15,
    color: '#E8E8EA',
    fontWeight: '600',
  },
  taskArrow: {
    color: '#C9A84C',
    fontSize: 20,
  },

  // Job Summary
  jobSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 14,
  },
  jobSummaryIcon: { fontSize: 32 },
  jobSummaryText: { flex: 1 },
  jobSummaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C9A84C',
  },
  jobSummaryCat: {
    fontSize: 13,
    color: '#888890',
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Budget
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  budgetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetBtnText: {
    color: '#C9A84C',
    fontSize: 24,
    fontWeight: '700',
  },
  budgetAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#C9A84C',
  },
  budgetHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#444450',
  },

  // Timing
  timingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timingBtn: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  timingBtnActive: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  timingText: {
    fontSize: 12,
    color: '#888890',
    fontWeight: '600',
  },
  timingTextActive: {
    color: '#C9A84C',
  },

  // Photo
  photoUpload: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  photoIcon: { fontSize: 32 },
  photoText: {
    fontSize: 14,
    color: '#888890',
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: '#444450',
  },

  // Notes
  notesInput: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: '#E8E8EA',
    textAlignVertical: 'top',
    minHeight: 90,
  },

  // Post Button
  postButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  postButtonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },
  postButtonSub: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
});