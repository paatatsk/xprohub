import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INDUSTRIES = [
  '🏗️ Construction', '🧹 Cleaning', '🌿 Landscaping', '🍽️ Hospitality',
  '🏥 Healthcare', '🚚 Logistics', '🛡️ Security', '💻 Technology',
  '🎓 Education', '🏪 Retail', '🔧 Maintenance', '🎨 Creative',
];

const SERVICES_NEEDED = [
  '🔧 General Labour', '🧹 Cleaning Staff', '🚗 Drivers',
  '👷 Tradespeople', '💼 Admin Support', '🍳 Kitchen Staff',
  '🛡️ Security Staff', '🌿 Groundskeeping', '💻 IT Support',
  '📦 Warehouse Staff', '🎯 Event Staff', '🏗️ Construction',
];

const COMPANY_SIZE = ['1–10', '11–50', '51–200', '201–500', '500+'];

export default function BusinessProfileBuilderScreen() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState('');

  const toggleService = (item: string) => {
    setSelectedServices(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const profileStrength = () => {
    let score = 0;
    if (companyName.length > 2) score++;
    if (description.length > 20) score++;
    if (selectedIndustry) score++;
    if (selectedServices.length >= 1) score++;
    if (companySize) score++;
    return score;
  };

  const strength = profileStrength();
  const strengthPercent = Math.round((strength / 5) * 100);

  const getStrengthLabel = () => {
    if (strength <= 1) return { label: 'Getting Started', color: '#E05252' };
    if (strength <= 3) return { label: 'Looking Professional', color: '#C9A84C' };
    return { label: 'Business Ready! 🏆', color: '#4CAF7A' };
  };

  const strengthInfo = getStrengthLabel();
  const canContinue = companyName.length > 2 && selectedIndustry.length > 0 && selectedServices.length >= 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🏢</Text>
          <Text style={styles.title}>Build Your Business Card</Text>
          <Text style={styles.subtitle}>Step 3 of 3 — Tell workers who you are</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        {/* Profile Strength */}
        <View style={[styles.strengthCard, { borderColor: strengthInfo.color }]}>
          <View style={styles.strengthTop}>
            <Text style={styles.strengthTitle}>Profile Strength</Text>
            <Text style={[styles.strengthLabel, { color: strengthInfo.color }]}>
              {strengthInfo.label}
            </Text>
          </View>
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, {
              width: `${strengthPercent}%`,
              backgroundColor: strengthInfo.color,
            }]} />
          </View>
          <Text style={styles.strengthSub}>
            {strengthPercent}% complete — stronger profile = better workers!
          </Text>
        </View>

        {/* Company Name */}
        <Text style={styles.sectionTitle}>🏢 Company Name</Text>
        <Text style={styles.sectionSub}>Your official business name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Acme Services Ltd."
          placeholderTextColor="#555"
          value={companyName}
          onChangeText={setCompanyName}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>📝 About Your Business</Text>
        <Text style={styles.sectionSub}>Tell workers what your company does</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. We are a leading cleaning company serving commercial properties across the city. We value reliable, professional staff..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          maxLength={300}
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

        {/* Industry */}
        <Text style={styles.sectionTitle}>🏭 Industry</Text>
        <Text style={styles.sectionSub}>What industry are you in?</Text>
        <View style={styles.chipGrid}>
          {INDUSTRIES.map(ind => {
            const active = selectedIndustry === ind;
            return (
              <TouchableOpacity
                key={ind}
                style={[styles.chip, active && styles.chipActiveBlue]}
                onPress={() => setSelectedIndustry(ind)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextBlue]}>{ind}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Services Needed */}
        <Text style={styles.sectionTitle}>🛠️ Services You Need</Text>
        <Text style={styles.sectionSub}>What kind of workers do you hire?</Text>
        <View style={styles.chipGrid}>
          {SERVICES_NEEDED.map(svc => {
            const active = selectedServices.includes(svc);
            return (
              <TouchableOpacity
                key={svc}
                style={[styles.chip, active && styles.chipActiveGold]}
                onPress={() => toggleService(svc)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextGold]}>{svc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Company Size */}
        <Text style={styles.sectionTitle}>👥 Company Size</Text>
        <Text style={styles.sectionSub}>How many employees do you have?</Text>
        <View style={styles.chipGrid}>
          {COMPANY_SIZE.map(size => {
            const active = companySize === size;
            return (
              <TouchableOpacity
                key={size}
                style={[styles.chip, active && styles.chipActiveGreen]}
                onPress={() => setCompanySize(size)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextGreen]}>{size} employees</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logo hint */}
        <View style={styles.logoHint}>
          <Text style={styles.logoEmoji}>🖼️</Text>
          <View style={styles.logoText}>
            <Text style={styles.logoTitle}>Company Logo</Text>
            <Text style={styles.logoSub}>
              Upload your logo after signup — it appears on all your job postings!
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={() => router.push('/(tabs)')}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
            {canContinue ? '🚀 Launch Business Profile →' : 'Add name, industry & 1 service'}
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
  strengthCard: {
    backgroundColor: '#171719',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
  },
  strengthTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  strengthTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  strengthLabel: { fontSize: 14, fontWeight: '700' },
  strengthBar: { height: 6, backgroundColor: '#2E2E33', borderRadius: 3, marginBottom: 8 },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthSub: { fontSize: 12, color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4, marginTop: 8 },
  sectionSub: { fontSize: 12, color: '#888', marginBottom: 12 },
  input: {
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    color: '#FFF',
    fontSize: 15,
    padding: 14,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    color: '#FFF',
    fontSize: 14,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#555', textAlign: 'right', marginTop: 4, marginBottom: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: '#171719',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2E33',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActiveBlue: { backgroundColor: '#0F151A', borderColor: '#4A9EDB' },
  chipActiveGold: { backgroundColor: '#1A1700', borderColor: '#C9A84C' },
  chipActiveGreen: { backgroundColor: '#0F1A0F', borderColor: '#4CAF7A' },
  chipText: { fontSize: 13, color: '#888' },
  chipTextBlue: { color: '#4A9EDB', fontWeight: '600' },
  chipTextGold: { color: '#C9A84C', fontWeight: '600' },
  chipTextGreen: { color: '#4CAF7A', fontWeight: '600' },
  logoHint: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 28, marginRight: 14 },
  logoText: { flex: 1 },
  logoTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  logoSub: { fontSize: 12, color: '#888', lineHeight: 18 },
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
  buttonText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },
  buttonTextDisabled: { color: '#555', fontSize: 13 },
  backBtn: { alignItems: 'center' },
  backText: { fontSize: 14, color: '#888' },
});