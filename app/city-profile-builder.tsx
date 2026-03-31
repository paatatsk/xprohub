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

const ORG_TYPES = [
  '🏙️ City Council', '🏥 Public Health', '🎓 Education Board',
  '🚒 Emergency Services', '🌿 Parks & Recreation', '🚌 Public Transit',
  '🏗️ Public Works', '⚖️ Justice & Courts', '🛡️ Law Enforcement',
  '💧 Utilities', '🏛️ Government Office', '🤝 Non-Profit Org',
];

const SERVICES_NEEDED = [
  '🔧 Maintenance Staff', '🧹 Cleaning Crew', '🌿 Groundskeeping',
  '🚗 Drivers', '👷 Construction', '💼 Admin Support',
  '🎯 Event Staff', '🛡️ Security', '💻 IT Support',
  '📦 Logistics', '🍳 Catering', '🏗️ Infrastructure',
];

const JURISDICTION = [
  '🏘️ Local / Municipal', '🏙️ City Wide',
  '🗺️ Regional', '🌍 National',
];

export default function CityProfileBuilderScreen() {
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOrgType, setSelectedOrgType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const toggleService = (item: string) => {
    setSelectedServices(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const profileStrength = () => {
    let score = 0;
    if (orgName.length > 2) score++;
    if (department.length > 2) score++;
    if (description.length > 20) score++;
    if (selectedOrgType) score++;
    if (selectedServices.length >= 1) score++;
    if (selectedJurisdiction) score++;
    if (contactPerson.length > 2) score++;
    return score;
  };

  const strength = profileStrength();
  const strengthPercent = Math.round((strength / 7) * 100);

  const getStrengthLabel = () => {
    if (strength <= 2) return { label: 'Getting Started', color: '#E05252' };
    if (strength <= 4) return { label: 'Looking Official', color: '#C9A84C' };
    return { label: 'Institution Ready! 🏛️', color: '#4CAF7A' };
  };

  const strengthInfo = getStrengthLabel();
  const canContinue = orgName.length > 2 && selectedOrgType.length > 0 && selectedServices.length >= 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🏛️</Text>
          <Text style={styles.title}>Build Your Institution Profile</Text>
          <Text style={styles.subtitle}>Step 3 of 3 — Tell workers who you represent</Text>
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
            {strengthPercent}% complete — stronger profile = more trusted workers!
          </Text>
        </View>

        {/* Organization Name */}
        <Text style={styles.sectionTitle}>🏛️ Organization Name</Text>
        <Text style={styles.sectionSub}>Your official institution name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. City of Toronto — Parks Department"
          placeholderTextColor="#555"
          value={orgName}
          onChangeText={setOrgName}
          maxLength={100}
        />

        {/* Department */}
        <Text style={styles.sectionTitle}>🏢 Department</Text>
        <Text style={styles.sectionSub}>Which department are you from?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Public Works Division"
          placeholderTextColor="#555"
          value={department}
          onChangeText={setDepartment}
          maxLength={100}
        />

        {/* Contact Person */}
        <Text style={styles.sectionTitle}>👤 Contact Person</Text>
        <Text style={styles.sectionSub}>Who should workers contact?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Smith — HR Manager"
          placeholderTextColor="#555"
          value={contactPerson}
          onChangeText={setContactPerson}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>📝 About Your Institution</Text>
        <Text style={styles.sectionSub}>Tell workers what your institution does</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. We are the City of Toronto Parks Department responsible for maintaining over 1,500 parks and green spaces across the city..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          maxLength={300}
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

        {/* Organization Type */}
        <Text style={styles.sectionTitle}>🏷️ Organization Type</Text>
        <Text style={styles.sectionSub}>What type of institution are you?</Text>
        <View style={styles.chipGrid}>
          {ORG_TYPES.map(type => {
            const active = selectedOrgType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, active && styles.chipActiveBlue]}
                onPress={() => setSelectedOrgType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextBlue]}>{type}</Text>
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

        {/* Jurisdiction */}
        <Text style={styles.sectionTitle}>🗺️ Jurisdiction</Text>
        <Text style={styles.sectionSub}>What area does your institution cover?</Text>
        <View style={styles.chipGrid}>
          {JURISDICTION.map(j => {
            const active = selectedJurisdiction === j;
            return (
              <TouchableOpacity
                key={j}
                style={[styles.chip, active && styles.chipActiveGreen]}
                onPress={() => setSelectedJurisdiction(j)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextGreen]}>{j}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Seal hint */}
        <View style={styles.sealHint}>
          <Text style={styles.sealEmoji}>🔏</Text>
          <View style={styles.sealText}>
            <Text style={styles.sealTitle}>Official Seal / Logo</Text>
            <Text style={styles.sealSub}>
              Upload your official seal or crest after signup — it builds maximum trust with workers!
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
            {canContinue ? '🚀 Launch Institution Profile →' : 'Add name, type & 1 service'}
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
  sealHint: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  sealEmoji: { fontSize: 28, marginRight: 14 },
  sealText: { flex: 1 },
  sealTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  sealSub: { fontSize: 12, color: '#888', lineHeight: 18 },
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