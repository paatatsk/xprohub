import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type IndividualType = 'provider' | 'customer' | null;

export default function IndividualTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<IndividualType>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push('/trust-setup');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dollarIcon}>💰</Text>
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>Step 2 of 4 — How will you use XProHub?</Text>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
      </View>

      {/* Section */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Choose your role</Text>
        <Text style={styles.sectionSub}>
          You can always add the other role later from your profile
        </Text>

        {/* Service Provider Card */}
        <TouchableOpacity
          style={[styles.card, selected === 'provider' && styles.cardSelected]}
          onPress={() => setSelected('provider')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: '#1A2A1A' }]}>
            <Text style={styles.cardEmoji}>🛠️</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Service Provider</Text>
            <Text style={styles.cardSubtitle}>
              I have skills and want to earn income
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { borderColor: '#4CAF7A' }]}>
                <Text style={[styles.tagText, { color: '#4CAF7A' }]}>🎨 Skills & Portfolio</Text>
              </View>
              <View style={[styles.tag, { borderColor: '#4CAF7A' }]}>
                <Text style={[styles.tagText, { color: '#4CAF7A' }]}>💰 Set Your Rate</Text>
              </View>
            </View>
          </View>
          <View style={[styles.radio, selected === 'provider' && styles.radioActive]}>
            {selected === 'provider' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Customer Card */}
        <TouchableOpacity
          style={[styles.card, selected === 'customer' && styles.cardSelectedBlue]}
          onPress={() => setSelected('customer')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: '#1A1E2A' }]}>
            <Text style={styles.cardEmoji}>🏠</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Customer</Text>
            <Text style={styles.cardSubtitle}>
              I need help with tasks and services
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { borderColor: '#4A9EDB' }]}>
                <Text style={[styles.tagText, { color: '#4A9EDB' }]}>📋 Post Jobs</Text>
              </View>
              <View style={[styles.tag, { borderColor: '#4A9EDB' }]}>
                <Text style={[styles.tagText, { color: '#4A9EDB' }]}>⭐ Hire Pros</Text>
              </View>
            </View>
          </View>
          <View style={[styles.radio, selected === 'customer' && styles.radioActiveBlue]}>
            {selected === 'customer' && <View style={[styles.radioDot, { backgroundColor: '#4A9EDB' }]} />}
          </View>
        </TouchableOpacity>

        {/* Both option hint */}
        <View style={styles.bothHint}>
          <Text style={styles.bothHintText}>
            💡 Want to do both? You can add the second role anytime from your profile settings.
          </Text>
        </View>
      </View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, !selected && styles.buttonTextDisabled]}>
            Continue →
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
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dollarIcon: {
    fontSize: 38,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 14,
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#2E2E33',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#C9A84C',
    borderRadius: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2E2E33',
    padding: 16,
    marginBottom: 14,
  },
  cardSelected: {
    borderColor: '#4CAF7A',
    backgroundColor: '#0F1A0F',
  },
  cardSelectedBlue: {
    borderColor: '#4A9EDB',
    backgroundColor: '#0F151A',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioActive: {
    borderColor: '#4CAF7A',
  },
  radioActiveBlue: {
    borderColor: '#4A9EDB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF7A',
  },
  bothHint: {
    backgroundColor: '#171719',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 14,
    marginTop: 4,
  },
  bothHintText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  footer: {
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
  buttonDisabled: {
    backgroundColor: '#2E2E33',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  buttonTextDisabled: {
    color: '#555',
  },
  backBtn: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#888',
  },
});