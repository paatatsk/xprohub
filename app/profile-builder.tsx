import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const SKILLS = [
  '🔧 Plumbing', '⚡ Electrical', '🪟 Cleaning', '🌿 Gardening',
  '🎨 Painting', '🪚 Carpentry', '🚗 Driving', '👶 Childcare',
  '🐾 Pet Care', '💻 Tech Help', '🍳 Cooking', '💪 Moving',
  '🔑 Locksmith', '❄️ HVAC', '📦 Assembly', '🧹 Housekeeping',
];

const LANGUAGES = ['🇺🇸 English', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German', '🇨🇳 Mandarin', '🇧🇷 Portuguese', '🇸🇦 Arabic', '🇷🇺 Russian'];

const AVAILABILITY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EXPERIENCE = ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

const TRAVEL = ['1 km', '5 km', '10 km', '25 km', '50 km+'];

export default function ProfileBuilderScreen() {
  const router = useRouter();

  const [bio, setBio] = useState('');
  const [rate, setRate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [travel, setTravel] = useState('');

  const toggleItem = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const profileStrength = () => {
    let score = 0;
    if (bio.length > 20) score++;
    if (rate.length > 0) score++;
    if (selectedSkills.length >= 2) score++;
    if (selectedLangs.length > 0) score++;
    if (selectedDays.length > 0) score++;
    if (experience) score++;
    if (travel) score++;
    return score;
  };

  const strength = profileStrength();
  const strengthPercent = Math.round((strength / 7) * 100);

  const getStrengthLabel = () => {
    if (strength <= 2) return { label: 'Getting Started', color: '#E05252' };
    if (strength <= 4) return { label: 'Looking Good', color: '#C9A84C' };
    if (strength <= 6) return { label: 'Strong Profile', color: '#4CAF7A' };
    return { label: 'All Star! ⭐', color: '#C9A84C' };
  };

  const strengthInfo = getStrengthLabel();
  const canContinue = selectedSkills.length >= 1 && bio.length > 10 && rate.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dollarIcon}>💰</Text>
          <Text style={styles.title}>Build Your Profile</Text>
          <Text style={styles.subtitle}>Step 4 of 4 — Let the world know what you do</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        {/* Profile Strength Meter */}
        <View style={[styles.strengthCard, { borderColor: strengthInfo.color }]}>
          <View style={styles.strengthTop}>
            <Text style={styles.strengthTitle}>Profile Strength</Text>
            <Text style={[styles.strengthLabel, { color: strengthInfo.color }]}>
              {strengthInfo.label}
            </Text>
          </View>
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                { width: `${strengthPercent}%`, backgroundColor: strengthInfo.color },
              ]}
            />
          </View>
          <Text style={styles.strengthSub}>
            {strengthPercent}% complete — stronger profile = more jobs!
          </Text>
        </View>

        {/* Bio */}
        <Text style={styles.sectionTitle}>🧑 About You</Text>
        <Text style={styles.sectionSub}>Tell clients what makes you great</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. I'm a skilled plumber with 5 years experience. I take pride in clean, reliable work and always show up on time..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={setBio}
          maxLength={300}
        />
        <Text style={styles.charCount}>{bio.length}/300</Text>

        {/* Hourly Rate */}
        <Text style={styles.sectionTitle}>💰 Your Hourly Rate</Text>
        <Text style={styles.sectionSub}>Set a fair rate for your skills</Text>
        <View style={styles.rateRow}>
          <Text style={styles.rateCurrency}>$</Text>
          <TextInput
            style={styles.rateInput}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            value={rate}
            onChangeText={setRate}
            maxLength={4}
          />
          <Text style={styles.rateLabel}>/ hour</Text>
        </View>

        {/* Skills */}
        <Text style={styles.sectionTitle}>🛠️ Your Skills</Text>
        <Text style={styles.sectionSub}>Pick at least 1 — select all that apply</Text>
        <View style={styles.chipGrid}>
          {SKILLS.map(skill => {
            const active = selectedSkills.includes(skill);
            return (
              <TouchableOpacity
                key={skill}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleItem(skill, selectedSkills, setSelectedSkills)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Availability */}
        <Text style={styles.sectionTitle}>🗓️ Availability</Text>
        <Text style={styles.sectionSub}>Which days can you work?</Text>
        <View style={styles.dayRow}>
          {AVAILABILITY.map(day => {
            const active = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleItem(day, selectedDays, setSelectedDays)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Languages */}
        <Text style={styles.sectionTitle}>🌍 Languages</Text>
        <Text style={styles.sectionSub}>Which languages do you speak?</Text>
        <View style={styles.chipGrid}>
          {LANGUAGES.map(lang => {
            const active = selectedLangs.includes(lang);
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, active && styles.chipActivePurple]}
                onPress={() => toggleItem(lang, selectedLangs, setSelectedLangs)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextPurple]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Experience */}
        <Text style={styles.sectionTitle}>📅 Years of Experience</Text>
        <Text style={styles.sectionSub}>How long have you been doing this?</Text>
        <View style={styles.chipGrid}>
          {EXPERIENCE.map(exp => {
            const active = experience === exp;
            return (
              <TouchableOpacity
                key={exp}
                style={[styles.chip, active && styles.chipActiveBlue]}
                onPress={() => setExperience(exp)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextBlue]}>
                  {exp}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Travel Distance */}
        <Text style={styles.sectionTitle}>📍 Service Area</Text>
        <Text style={styles.sectionSub}>How far will you travel for a job?</Text>
        <View style={styles.chipGrid}>
          {TRAVEL.map(dist => {
            const active = travel === dist;
            return (
              <TouchableOpacity
                key={dist}
                style={[styles.chip, active && styles.chipActiveGold]}
                onPress={() => setTravel(dist)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextGold]}>
                  {dist}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Portfolio hint */}
        <View style={styles.portfolioHint}>
          <Text style={styles.portfolioEmoji}>📸</Text>
          <View style={styles.portfolioText}>
            <Text style={styles.portfolioTitle}>Portfolio Photos</Text>
            <Text style={styles.portfolioSub}>
              Add photos of your past work after signup — clients love seeing real results!
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
            {canContinue ? '🚀 Launch My Profile →' : 'Add bio, rate & at least 1 skill'}
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
  dollarIcon: { fontSize: 38, marginBottom: 10 },
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
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  rateCurrency: { fontSize: 22, color: '#C9A84C', fontWeight: '800', marginRight: 8 },
  rateInput: { fontSize: 28, color: '#FFF', fontWeight: '800', flex: 1 },
  rateLabel: { fontSize: 16, color: '#888' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    backgroundColor: '#171719',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2E33',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#0F1A0F', borderColor: '#4CAF7A' },
  chipActivePurple: { backgroundColor: '#150F1A', borderColor: '#9B6EE8' },
  chipActiveBlue: { backgroundColor: '#0F151A', borderColor: '#4A9EDB' },
  chipActiveGold: { backgroundColor: '#1A1700', borderColor: '#C9A84C' },
  chipText: { fontSize: 13, color: '#888' },
  chipTextActive: { color: '#4CAF7A', fontWeight: '600' },
  chipTextPurple: { color: '#9B6EE8', fontWeight: '600' },
  chipTextBlue: { color: '#4A9EDB', fontWeight: '600' },
  chipTextGold: { color: '#C9A84C', fontWeight: '600' },
  dayRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dayChip: {
    flex: 1,
    backgroundColor: '#171719',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E33',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: '#1A1700', borderColor: '#C9A84C' },
  dayText: { fontSize: 12, color: '#888', fontWeight: '600' },
  dayTextActive: { color: '#C9A84C' },
  portfolioHint: {
    flexDirection: 'row',
    backgroundColor: '#171719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  portfolioEmoji: { fontSize: 28, marginRight: 14 },
  portfolioText: { flex: 1 },
  portfolioTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  portfolioSub: { fontSize: 12, color: '#888', lineHeight: 18 },
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