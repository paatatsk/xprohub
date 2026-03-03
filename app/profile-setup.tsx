import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SKILLS = [
  { icon: '🧹', name: 'Cleaning' },
  { icon: '📦', name: 'Errands' },
  { icon: '🐾', name: 'Pet Care' },
  { icon: '👶', name: 'Child Care' },
  { icon: '📚', name: 'Tutoring' },
  { icon: '🏆', name: 'Sports Coach' },
  { icon: '🍽️', name: 'Catering' },
  { icon: '🎭', name: 'Entertainment' },
  { icon: '🚗', name: 'Vehicle Care' },
  { icon: '📦', name: 'Moving' },
  { icon: '⚡', name: 'Electrical' },
  { icon: '🔧', name: 'Plumbing' },
  { icon: '🎨', name: 'Painting' },
  { icon: '🪚', name: 'Carpentry' },
  { icon: '💻', name: 'IT & Tech' },
  { icon: '❄️', name: 'HVAC' },
];

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('both');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const toggleSkill = (skillName) => {
    setSelectedSkills(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a little about yourself</Text>
      </View>

      {/* Avatar */}
      <TouchableOpacity style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.avatarLabel}>Tap to add photo</Text>
      </TouchableOpacity>

      {/* Name Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#444450"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>I WANT TO</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'worker' && styles.modeBtnActive]}
            onPress={() => setMode('worker')}>
            <Text style={styles.modeIcon}>💼</Text>
            <Text style={[styles.modeName, mode === 'worker' && styles.modeNameActive]}>Find Work</Text>
            <Text style={styles.modeDesc}>Earn money doing tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'customer' && styles.modeBtnActive]}
            onPress={() => setMode('customer')}>
            <Text style={styles.modeIcon}>📋</Text>
            <Text style={[styles.modeName, mode === 'customer' && styles.modeNameActive]}>Hire People</Text>
            <Text style={styles.modeDesc}>Get tasks done fast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'both' && styles.modeBtnActive]}
            onPress={() => setMode('both')}>
            <Text style={styles.modeIcon}>⚡</Text>
            <Text style={[styles.modeName, mode === 'both' && styles.modeNameActive]}>Both</Text>
            <Text style={styles.modeDesc}>Work and hire</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Skills */}
      {(mode === 'worker' || mode === 'both') && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY SKILLS — TAP TO SELECT</Text>
          <Text style={styles.skillsHint}>Choose everything you can do</Text>
          <View style={styles.skillsGrid}>
            {SKILLS.map((skill) => (
              <TouchableOpacity
                key={skill.name}
                style={[styles.skillTile, selectedSkills.includes(skill.name) && styles.skillTileActive]}
                onPress={() => toggleSkill(skill.name)}>
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                <Text style={[styles.skillName, selectedSkills.includes(skill.name) && styles.skillNameActive]}>
                  {skill.name}
                </Text>
                {selectedSkills.includes(skill.name) && (
                  <Text style={styles.skillCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.continueButtonText}>
          {selectedSkills.length > 0
            ? `Continue with ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
            : 'Continue'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },

  // Header
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A84C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888890',
  },

  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0E0E0F',
  },
  avatarLabel: {
    fontSize: 13,
    color: '#888890',
  },

  // Section
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888890',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // Input
  input: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#E8E8EA',
  },

  // Mode
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  modeBtnActive: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  modeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  modeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888890',
  },
  modeNameActive: {
    color: '#C9A84C',
  },
  modeDesc: {
    fontSize: 10,
    color: '#444450',
    textAlign: 'center',
  },

  // Skills Grid
  skillsHint: {
    fontSize: 13,
    color: '#444450',
    marginBottom: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTile: {
    width: '30%',
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  skillTileActive: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  skillIcon: {
    fontSize: 24,
  },
  skillName: {
    fontSize: 11,
    color: '#888890',
    fontWeight: '600',
    textAlign: 'center',
  },
  skillNameActive: {
    color: '#C9A84C',
  },
  skillCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 10,
    color: '#C9A84C',
    fontWeight: '800',
  },

  // Continue Button
  continueButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    color: '#0E0E0F',
    fontSize: 16,
    fontWeight: '800',
  },
});