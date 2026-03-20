import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GoldenDollar from '../components/GoldenDollar';
import HomeBeacon from '../components/HomeBeacon';

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    icon: '👤',
    title: 'Individual',
    desc: 'I need help around the home',
    color: '#C9A84C',
    verification: 'Email only',
  },
  {
    id: 'business',
    icon: '🏢',
    title: 'Business',
    desc: 'I represent a company',
    color: '#5599E0',
    verification: 'Business docs required',
  },
  {
    id: 'government',
    icon: '🏛️',
    title: 'City / Organization',
    desc: 'I represent a public institution',
    color: '#4CAF7A',
    verification: 'Official ID required',
  },
  {
    id: 'worker',
    icon: '💼',
    title: 'Worker',
    desc: 'I want to earn income with my skills',
    color: '#9B6EE8',
    verification: 'Identity verification',
  },
  {
    id: 'both',
    icon: '🔄',
    title: 'Both',
    desc: 'I want to work AND hire others',
    color: '#C9A84C',
    verification: 'Full verification',
  },
];

const SKILLS = [
  { icon: '🧹', name: 'Cleaning' },
  { icon: '🔧', name: 'Repairs' },
  { icon: '🛒', name: 'Errands' },
  { icon: '🐾', name: 'Pet Care' },
  { icon: '👶', name: 'Child Care' },
  { icon: '📚', name: 'Tutoring' },
  { icon: '💪', name: 'Sports' },
  { icon: '🍽️', name: 'Catering' },
  { icon: '🎉', name: 'Events' },
  { icon: '⚡', name: 'Electrical' },
  { icon: '🚿', name: 'Plumbing' },
  { icon: '🎨', name: 'Painting' },
  { icon: '🪚', name: 'Carpentry' },
  { icon: '💻', name: 'IT Help' },
  { icon: '❄️', name: 'HVAC' },
  { icon: '🚗', name: 'Vehicle Care' },
];

export default function ProfileSetupScreen() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [name, setName] = useState('Sofia Rodriguez');

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const showSkills = selectedType === 'worker' || selectedType === 'both';

  const canProceed = () => {
    if (step === 1) return selectedType !== null;
    if (step === 2 && showSkills) return selectedSkills.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && showSkills) {
      setStep(2);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <GoldenDollar size="small" speed="slow" pulse={true} glow={true} />
        <Text style={styles.headerTitle}>Set Up Your Profile</Text>
        <Text style={styles.headerSub}>
          {step === 1 ? 'Step 1 of 2 — Choose your account type' : 'Step 2 of 2 — Select your skills'}
        </Text>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* STEP 1 — Account Type */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What best describes you?</Text>
            <Text style={styles.sectionDesc}>You can always change this later in your profile settings</Text>

            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected,
                  selectedType === type.id && { borderColor: type.color },
                ]}
                onPress={() => setSelectedType(type.id)}>

                <View style={[styles.typeIconBox, { backgroundColor: `${type.color}15` }]}>
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                </View>

                <View style={styles.typeInfo}>
                  <Text style={[styles.typeTitle, selectedType === type.id && { color: type.color }]}>
                    {type.title}
                  </Text>
                  <Text style={styles.typeDesc}>{type.desc}</Text>
                  <View style={styles.verificationBadge}>
                    <Text style={styles.verificationText}>🔒 {type.verification}</Text>
                  </View>
                </View>

                <View style={[
                  styles.typeCheck,
                  selectedType === type.id && { backgroundColor: type.color, borderColor: type.color }
                ]}>
                  {selectedType === type.id && (
                    <Text style={styles.typeCheckText}>✓</Text>
                  )}
                </View>

              </TouchableOpacity>
            ))}

            {/* Both Option Info */}
            {selectedType === 'both' && (
              <View style={styles.bothInfo}>
                <Text style={styles.bothInfoIcon}>🌟</Text>
                <View style={styles.bothInfoText}>
                  <Text style={styles.bothInfoTitle}>XProHub Community Member!</Text>
                  <Text style={styles.bothInfoDesc}>
                    As a Both member you earn income AND hire others. You get a 5% loyalty discount when hiring fellow XProHub workers — community supporting community! 💛
                  </Text>
                </View>
              </View>
            )}

            {/* Business Info */}
            {selectedType === 'business' && (
              <View style={styles.businessInfo}>
                <Text style={styles.businessInfoIcon}>🏢</Text>
                <View style={styles.businessInfoText}>
                  <Text style={styles.businessInfoTitle}>Business Account Benefits</Text>
                  <Text style={styles.businessInfoDesc}>
                    Post unlimited jobs simultaneously, set up recurring schedules, manage a team of posters, get full invoicing and priority support.
                  </Text>
                </View>
              </View>
            )}

            {/* Government Info */}
            {selectedType === 'government' && (
              <View style={styles.govInfo}>
                <Text style={styles.govInfoIcon}>🏛️</Text>
                <View style={styles.govInfoText}>
                  <Text style={styles.govInfoTitle}>City / Organization Account</Text>
                  <Text style={styles.govInfoDesc}>
                    Post public temporary jobs, access verified Belt 3+ workers, get compliance reports and a dedicated account manager.
                  </Text>
                </View>
              </View>
            )}

          </View>
        )}

        {/* STEP 2 — Skills (Workers and Both only) */}
        {step === 2 && showSkills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What are your skills?</Text>
            <Text style={styles.sectionDesc}>Select all that apply — you can add more later</Text>

            <View style={styles.skillsGrid}>
              {SKILLS.map((skill) => (
                <TouchableOpacity
                  key={skill.name}
                  style={[
                    styles.skillChip,
                    selectedSkills.includes(skill.name) && styles.skillChipSelected,
                  ]}
                  onPress={() => toggleSkill(skill.name)}>
                  <Text style={styles.skillIcon}>{skill.icon}</Text>
                  <Text style={[
                    styles.skillName,
                    selectedSkills.includes(skill.name) && styles.skillNameSelected,
                  ]}>
                    {skill.name}
                  </Text>
                  {selectedSkills.includes(skill.name) && (
                    <Text style={styles.skillCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedSkills.length > 0 && (
              <View style={styles.skillsSelected}>
                <Text style={styles.skillsSelectedText}>
                  ✅ {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
          </View>
        )}

        {/* White Belt Welcome for workers */}
        {step === 2 && showSkills && (
          <View style={styles.beltWelcome}>
            <Text style={styles.beltWelcomeIcon}>🥋</Text>
            <View style={styles.beltWelcomeText}>
              <Text style={styles.beltWelcomeTitle}>You start as a White Belt!</Text>
              <Text style={styles.beltWelcomeDesc}>
                Complete your first 5 jobs to earn your Yellow Belt. XProHub Guarantee protects your first 3 jobs and you pay only 5% platform fee as a newcomer!
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomBar}>
        {step === 2 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(1)}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !canProceed() && styles.continueBtnDisabled,
            step === 2 && { flex: 1 },
          ]}
          onPress={() => canProceed() && handleNext()}>
          <Text style={styles.continueBtnText}>
            {step === 1 && !showSkills ? 'Get Started →' :
             step === 1 && showSkills ? 'Next — Add Skills →' :
             `Let's Go! (${selectedSkills.length} skills) →`}
          </Text>
        </TouchableOpacity>
      </View>

      <HomeBeacon />
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8E8EA',
    marginTop: 8,
  },
  headerSub: {
    fontSize: 13,
    color: '#888890',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2E2E33',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A84C',
    borderRadius: 2,
  },

  // Section
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8E8EA',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#888890',
    marginBottom: 20,
    lineHeight: 18,
  },

  // Account Type Cards
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  typeCardSelected: {
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  typeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: { fontSize: 24 },
  typeInfo: { flex: 1, gap: 4 },
  typeTitle: { fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  typeDesc: { fontSize: 12, color: '#888890' },
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F1F22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  verificationText: { fontSize: 10, color: '#444450' },
  typeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCheckText: { fontSize: 12, color: '#0E0E0F', fontWeight: '800' },

  // Info Boxes
  bothInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  bothInfoIcon: { fontSize: 24 },
  bothInfoText: { flex: 1 },
  bothInfoTitle: { fontSize: 13, fontWeight: '800', color: '#C9A84C', marginBottom: 4 },
  bothInfoDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  businessInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(85,153,224,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(85,153,224,0.2)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  businessInfoIcon: { fontSize: 24 },
  businessInfoText: { flex: 1 },
  businessInfoTitle: { fontSize: 13, fontWeight: '800', color: '#5599E0', marginBottom: 4 },
  businessInfoDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  govInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76,175,122,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.2)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  govInfoIcon: { fontSize: 24 },
  govInfoText: { flex: 1 },
  govInfoTitle: { fontSize: 13, fontWeight: '800', color: '#4CAF7A', marginBottom: 4 },
  govInfoDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  // Skills Grid
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  skillChipSelected: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  skillIcon: { fontSize: 18 },
  skillName: { fontSize: 13, color: '#888890', fontWeight: '600' },
  skillNameSelected: { color: '#C9A84C' },
  skillCheck: { fontSize: 11, color: '#C9A84C', fontWeight: '800' },
  skillsSelected: {
    backgroundColor: 'rgba(76,175,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,122,0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  skillsSelectedText: { fontSize: 13, color: '#4CAF7A', fontWeight: '700' },

  // Belt Welcome
  beltWelcome: {
    flexDirection: 'row',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  beltWelcomeIcon: { fontSize: 28 },
  beltWelcomeText: { flex: 1 },
  beltWelcomeTitle: { fontSize: 14, fontWeight: '800', color: '#C9A84C', marginBottom: 4 },
  beltWelcomeDesc: { fontSize: 12, color: '#888890', lineHeight: 18 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(14,14,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
    gap: 10,
  },
  backBtn: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: '#888890', fontSize: 15, fontWeight: '700' },
  continueBtn: {
    flex: 1,
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
  continueBtnDisabled: {
    backgroundColor: '#2A2A2E',
    shadowOpacity: 0,
  },
  continueBtnText: {
    color: '#0E0E0F',
    fontSize: 15,
    fontWeight: '800',
  },
});