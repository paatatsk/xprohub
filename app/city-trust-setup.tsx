import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ItemId =
  | 'official_email'
  | 'phone'
  | 'official_id'
  | 'gov_registration'
  | 'website'
  | 'social'
  | 'bank'
  | 'official_seal';

const MANDATORY: { id: ItemId; emoji: string; label: string; desc: string }[] = [
  { id: 'official_email', emoji: '📧', label: 'Official Email', desc: 'Your official government or org email' },
  { id: 'phone', emoji: '📱', label: 'Phone Number', desc: 'Official contact number' },
  { id: 'official_id', emoji: '🪪', label: 'Official ID', desc: 'Government issued identification' },
  { id: 'gov_registration', emoji: '📜', label: 'Registration Document', desc: 'Official registration or charter' },
];

const OPTIONAL: { id: ItemId; emoji: string; label: string; desc: string; reward: string }[] = [
  { id: 'website', emoji: '🌐', label: 'Official Website', desc: 'Your public institution website', reward: '+10 Trust Points' },
  { id: 'social', emoji: '📢', label: 'Official Social Media', desc: 'Verified social media accounts', reward: '+15 Trust Points' },
  { id: 'bank', emoji: '🏦', label: 'Bank Account', desc: 'For fast payments to workers', reward: '+20 Trust Points' },
  { id: 'official_seal', emoji: '🔏', label: 'Official Seal / Logo', desc: 'Your institution seal or crest', reward: '+25 Trust Points' },
];

const getTrustLevel = (completed: Set<ItemId>) => {
  const mandatoryDone = ['official_email', 'phone', 'official_id', 'gov_registration'].every(id =>
    completed.has(id as ItemId)
  );
  const optionalCount = ['website', 'social', 'bank', 'official_seal'].filter(id =>
    completed.has(id as ItemId)
  ).length;

  if (!mandatoryDone) {
    return {
      level: 1,
      label: 'Unverified',
      color: '#888',
      emoji: '⚪',
      message: 'Complete all mandatory items to get Verified',
    };
  }
  if (optionalCount === 0) {
    return {
      level: 2,
      label: 'Verified Institution',
      color: '#4A9EDB',
      emoji: '🔵',
      message: 'Add optional items to reach Gold status!',
    };
  }
  if (optionalCount >= 3) {
    return {
      level: 3,
      label: 'Gold Institution',
      color: '#C9A84C',
      emoji: '🏛️',
      message: 'Maximum trust — workers are proud to serve you!',
    };
  }
  return {
    level: 2,
    label: 'Verified+',
    color: '#4CAF7A',
    emoji: '🟢',
    message: `${3 - optionalCount} more item${3 - optionalCount > 1 ? 's' : ''} to reach Gold Institution!`,
  };
};

export default function CityTrustSetupScreen() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<ItemId>>(new Set());

  const toggle = (id: ItemId) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const mandatoryDone = ['official_email', 'phone', 'official_id', 'gov_registration'].every(id =>
    completed.has(id as ItemId)
  );

  const remainingCount = ['official_email', 'phone', 'official_id', 'gov_registration'].filter(
    id => !completed.has(id as ItemId)
  ).length;

  const trust = getTrustLevel(completed);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🏛️</Text>
          <Text style={styles.title}>Institution Verification</Text>
          <Text style={styles.subtitle}>Step 2 of 3 — Verify your institution</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
        </View>

        {/* Trust Badge */}
        <View style={[styles.trustBadge, { borderColor: trust.color }]}>
          <Text style={styles.trustEmoji}>{trust.emoji}</Text>
          <View style={styles.trustInfo}>
            <Text style={[styles.trustLabel, { color: trust.color }]}>{trust.label}</Text>
            <Text style={styles.trustMessage}>{trust.message}</Text>
          </View>
          <View style={styles.trustLevelBubble}>
            <Text style={[styles.trustLevelText, { color: trust.color }]}>Lv.{trust.level}</Text>
          </View>
        </View>

        {/* Mandatory */}
        <Text style={styles.sectionTitle}>🔒 Required to get started</Text>
        <Text style={styles.sectionSub}>All 4 items must be completed</Text>

        {MANDATORY.map(item => {
          const done = completed.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, done && styles.cardDone]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, done && styles.iconBoxDone]}>
                <Text style={styles.itemEmoji}>{done ? '✅' : item.emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <View style={[styles.check, done && styles.checkDone]}>
                {done && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Optional */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>⭐ Optional — Boost your trust level</Text>
        <Text style={styles.sectionSub}>More you add, more workers trust your institution</Text>

        {OPTIONAL.map(item => {
          const done = completed.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, done && styles.cardGold]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, done && styles.iconBoxGold]}>
                <Text style={styles.itemEmoji}>{done ? '✅' : item.emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, done && styles.cardTitleGold]}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>{item.reward}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !mandatoryDone && styles.buttonDisabled]}
          onPress={() => router.push('/city-profile-builder')}
          disabled={!mandatoryDone}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, !mandatoryDone && styles.buttonTextDisabled]}>
            {mandatoryDone
              ? 'Continue →'
              : `Complete ${remainingCount} more required item${remainingCount === 1 ? '' : 's'}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 42, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 14 },
  progressBar: { height: 4, width: '100%', backgroundColor: '#2E2E33', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#C9A84C', borderRadius: 2 },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
  },
  trustEmoji: { fontSize: 30, marginRight: 12 },
  trustInfo: { flex: 1 },
  trustLabel: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  trustMessage: { fontSize: 12, color: '#888', lineHeight: 18 },
  trustLevelBubble: {
    backgroundColor: '#2E2E33',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trustLevelText: { fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#888', marginBottom: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 14,
    marginBottom: 10,
  },
  cardDone: { borderColor: '#4CAF7A', backgroundColor: '#0F1A0F' },
  cardGold: { borderColor: '#C9A84C', backgroundColor: '#1A1700' },
  iconBox: {
    width: 48, height: 48,
    backgroundColor: '#2E2E33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxDone: { backgroundColor: '#1A2A1A' },
  iconBoxGold: { backgroundColor: '#2A2200' },
  itemEmoji: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 3 },
  cardTitleDone: { color: '#4CAF7A' },
  cardTitleGold: { color: '#C9A84C' },
  cardDesc: { fontSize: 12, color: '#888' },
  check: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#4CAF7A', borderColor: '#4CAF7A' },
  checkMark: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  rewardBadge: {
    backgroundColor: '#2A2200',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C9A84C',
  },
  rewardText: { fontSize: 10, color: '#C9A84C', fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    backgroundColor: '#0E0E0F',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
  },
  button: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { backgroundColor: '#2E2E33' },
  buttonText: { fontSize: 17, fontWeight: '800', color: '#0E0E0F' },
  buttonTextDisabled: { color: '#555' },
  backBtn: { alignItems: 'center' },
  backText: { fontSize: 14, color: '#888' },
});