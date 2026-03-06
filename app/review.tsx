import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReviewScreen() {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const TAGS = [
    '⚡ On Time', '✨ Great Quality', '💬 Communicative',
    '🛡️ Professional', '💰 Good Value', '🔄 Would Hire Again',
    '🧹 Thorough', '😊 Friendly', '⭐ Above & Beyond',
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const StarRow = () => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}>
          <Text style={[styles.star, star <= rating && styles.starActive]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const ratingLabel = () => {
    if (rating === 0) return 'Tap to rate';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Great';
    if (rating === 5) return 'Exceptional! ⭐';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Worker Card */}
        <View style={styles.workerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SR</Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>Sofia Rodriguez</Text>
            <Text style={styles.workerRole}>Deep Cleaning · 3 hrs</Text>
            <Text style={styles.jobDate}>Completed today · $82.50</Text>
          </View>
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Done</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionLabel}>YOUR RATING</Text>
          <StarRow />
          <Text style={styles.ratingLabel}>{ratingLabel()}</Text>
        </View>

        {/* Quick Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT STOOD OUT?</Text>
          <Text style={styles.sectionHint}>Select all that apply</Text>
          <View style={styles.tagsGrid}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Written Review */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WRITE A REVIEW</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience with Sofia. Your review helps other customers make better decisions..."
            placeholderTextColor="#444450"
            multiline
            numberOfLines={4}
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Text style={styles.charCount}>{reviewText.length} / 500</Text>
        </View>

        {/* XP Notice */}
        <View style={styles.xpNotice}>
          <Text style={styles.xpIcon}>⚡</Text>
          <View style={styles.xpText}>
            <Text style={styles.xpTitle}>Earn 50 XP for reviewing!</Text>
            <Text style={styles.xpDesc}>Help build the XProHub community and level up your profile</Text>
          </View>
        </View>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          Your review will be posted publicly on Sofia's profile. Be honest and respectful.
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={() => rating > 0 && router.replace('/(tabs)')}>
          <Text style={styles.submitButtonText}>
            {rating === 0 ? 'Select a Rating First' : `Submit Review · +50 XP ⚡`}
          </Text>
        </TouchableOpacity>
      </View>

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
  backBtn: { color: '#888890', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#E8E8EA' },

  // Worker Card
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2E2E33',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: { color: '#0E0E0F', fontSize: 16, fontWeight: '800' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '800', color: '#E8E8EA' },
  workerRole: { fontSize: 12, color: '#888890', marginTop: 2 },
  jobDate: { fontSize: 11, color: '#C9A84C', marginTop: 2 },
  completedBadge: {
    backgroundColor: 'rgba(76,175,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedText: { fontSize: 12, color: '#4CAF7A', fontWeight: '700' },

  // Rating
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  star: {
    fontSize: 44,
    color: '#2E2E33',
  },
  starActive: {
    color: '#C9A84C',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C9A84C',
  },

  // Tags
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
  },
  sectionHint: {
    fontSize: 12,
    color: '#444450',
    marginBottom: 12,
    marginTop: -8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagActive: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  tagText: {
    fontSize: 12,
    color: '#888890',
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#C9A84C',
  },

  // Review Input
  reviewInput: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: '#E8E8EA',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#444450',
    textAlign: 'right',
  },

  // XP Notice
  xpNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  xpIcon: { fontSize: 24 },
  xpText: { flex: 1 },
  xpTitle: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  xpDesc: { fontSize: 12, color: '#888890', marginTop: 2 },

  // Privacy
  privacyNote: {
    fontSize: 12,
    color: '#444450',
    textAlign: 'center',
    padding: 20,
    lineHeight: 18,
  },

  // Submit
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(14,14,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
  },
  submitButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#2A2A2E',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },
});