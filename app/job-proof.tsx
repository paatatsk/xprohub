import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const JOB = {
  title: 'Deep Cleaning',
  icon: '🏠',
  customerName: 'Marcus Johnson',
};

export default function JobProofScreen() {
  const [photos, setPhotos] = useState(['🛁', '🪴', '✨']);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('after');
  const [submitting, setSubmitting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAddPhoto = () => {
    const mockPhotos = ['🪟', '🛋️', '🚿', '🧹', '🪞'];
    const next = mockPhotos[photos.length % mockPhotos.length];
    setPhotos(prev => [...prev, next]);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => router.push('/job-confirm'), 600);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Complete</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step 1 of 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Job Banner */}
        <View style={styles.jobBanner}>
          <Text style={styles.jobIcon}>{JOB.icon}</Text>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{JOB.title}</Text>
            <Text style={styles.jobCustomer}>for {JOB.customerName}</Text>
          </View>
          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>✅ Done</Text>
          </View>
        </View>

        {/* Instruction */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>📸</Text>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Add proof photos</Text>
            <Text style={styles.instructionSub}>
              Show the completed work. Photos are timestamped and sent to {JOB.customerName}.
            </Text>
          </View>
        </View>

        {/* Before / After Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'after' && styles.tabActive]}
            onPress={() => setActiveTab('after')}>
            <Text style={[styles.tabText, activeTab === 'after' && styles.tabTextActive]}>
              📸 After Photos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'before' && styles.tabActive]}
            onPress={() => setActiveTab('before')}>
            <Text style={[styles.tabText, activeTab === 'before' && styles.tabTextActive]}>
              📷 Before
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo Area */}
        <TouchableOpacity style={styles.photoArea} onPress={handleAddPhoto} activeOpacity={0.8}>
          <Text style={styles.photoAreaIcon}>📷</Text>
          <Text style={styles.photoAreaText}>Tap to take a photo</Text>
          <Text style={styles.photoAreaSub}>or tap thumbnails below to manage</Text>
        </TouchableOpacity>

        {/* Photo Thumbnails */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbScroll}
          contentContainerStyle={styles.thumbRow}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.thumb}>
              <Text style={styles.thumbEmoji}>{photo}</Text>
              <View style={styles.thumbCheck}>
                <Text style={styles.thumbCheckText}>✓</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.thumbAdd} onPress={handleAddPhoto}>
            <Text style={styles.thumbAddText}>+</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.photoCount}>{photos.length} photo{photos.length !== 1 ? 's' : ''} added</Text>

        {/* Completion Note */}
        <Text style={styles.sectionLabel}>COMPLETION NOTE</Text>
        <TouchableOpacity style={styles.noteField} activeOpacity={0.8}>
          <Text style={styles.noteText}>
            {note || 'Describe what you completed (optional for most jobs)...'}
          </Text>
        </TouchableOpacity>

        {/* Note Quick Fills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFillScroll}
          contentContainerStyle={styles.quickFillRow}>
          {[
            'All areas cleaned thoroughly',
            'Job completed as requested',
            'Customer inspected and happy',
            'All surfaces sanitized',
          ].map((text) => (
            <TouchableOpacity
              key={text}
              style={styles.quickFillChip}
              onPress={() => setNote(text)}>
              <Text style={styles.quickFillText}>{text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* GPS Notice */}
        <View style={styles.gpsNotice}>
          <Text style={styles.gpsNoticeText}>
            📍 Photos are automatically tagged with your GPS location and timestamp
          </Text>
        </View>

        {/* Submit Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnLoading]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>
              {submitting ? '⏳ Submitting...' : '✅ Submit Proof & Clock Out'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.submitHint}>
          This will notify {JOB.customerName} to confirm the job
        </Text>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  backBtnText: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  stepBadge: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepBadgeText: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '700',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },

  // Job Banner
  jobBanner: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobIcon: { fontSize: 28 },
  jobInfo: { flex: 1 },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E8E8EA',
  },
  jobCustomer: {
    fontSize: 12,
    color: '#888890',
    marginTop: 2,
  },
  completeBadge: {
    backgroundColor: 'rgba(76,175,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completeBadgeText: {
    fontSize: 12,
    color: '#4CAF7A',
    fontWeight: '700',
  },

  // Instruction Card
  instructionCard: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionIcon: { fontSize: 24 },
  instructionText: { flex: 1 },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E8E8EA',
    marginBottom: 4,
  },
  instructionSub: {
    fontSize: 12,
    color: '#888890',
    lineHeight: 18,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#C9A84C',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888890',
  },
  tabTextActive: {
    color: '#0E0E0F',
  },

  // Photo Area
  photoArea: {
    backgroundColor: '#111113',
    borderWidth: 2,
    borderColor: '#2E2E33',
    borderStyle: 'dashed',
    borderRadius: 20,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoAreaIcon: { fontSize: 36 },
  photoAreaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888890',
  },
  photoAreaSub: {
    fontSize: 11,
    color: '#555558',
  },

  // Thumbnails
  thumbScroll: { flexGrow: 0 },
  thumbRow: {
    gap: 8,
    paddingVertical: 4,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbEmoji: { fontSize: 28 },
  thumbCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF7A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0E0E0F',
  },
  thumbCheckText: {
    fontSize: 10,
    color: '#0E0E0F',
    fontWeight: '800',
  },
  thumbAdd: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbAddText: {
    fontSize: 28,
    color: '#555558',
    fontWeight: '300',
  },
  photoCount: {
    fontSize: 12,
    color: '#4CAF7A',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },

  // Note
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 1.5,
    marginBottom: -4,
  },
  noteField: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
  },
  noteText: {
    fontSize: 13,
    color: '#555558',
    lineHeight: 20,
  },

  // Quick fills
  quickFillScroll: { flexGrow: 0, marginTop: -4 },
  quickFillRow: { gap: 8, paddingVertical: 4 },
  quickFillChip: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickFillText: {
    fontSize: 12,
    color: '#888890',
    fontWeight: '600',
  },

  // GPS Notice
  gpsNotice: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    padding: 12,
  },
  gpsNoticeText: {
    fontSize: 11,
    color: '#555558',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Submit
  submitBtn: {
    backgroundColor: '#4CAF7A',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4CAF7A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnLoading: {
    backgroundColor: '#2E2E33',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  submitHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#555558',
    marginTop: -4,
  },
});