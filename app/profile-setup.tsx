import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type AccountType = 'individual' | 'business' | 'city_org' | null;

const accountOptions = [
  {
    id: 'individual' as AccountType,
    emoji: '🧑',
    title: 'Individual',
    subtitle: 'I need help around the home',
    badge: '🔒 Email only',
    badgeColor: '#4A9EDB',
  },
  {
    id: 'business' as AccountType,
    emoji: '🏢',
    title: 'Business',
    subtitle: 'I represent a company',
    badge: '🔒 Business docs required',
    badgeColor: '#9B6EE8',
  },
  {
    id: 'city_org' as AccountType,
    emoji: '🏛️',
    title: 'City / Organization',
    subtitle: 'I represent a public institution',
    badge: '🔒 Official ID required',
    badgeColor: '#4CAF7A',
  },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<AccountType>(null);

  const handleGetStarted = () => {
    if (!selected) return;

    // Navigate based on account type
    if (selected === 'individual') {
      router.push('/individual-type');
    } else if (selected === 'business') {
      router.push('/business-trust-setup');
    } else if (selected === 'city_org') {
      router.push('/city-trust-setup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Dollar Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.dollarIcon}>💰</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>Step 1 of 2 — Choose your account type</Text>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>What best describes you?</Text>
        <Text style={styles.sectionSub}>
          You can always change this later in your profile settings
        </Text>

        {/* Options */}
        {accountOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(option.id)}
              activeOpacity={0.8}
            >
              {/* Emoji Icon */}
              <View style={styles.iconBox}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              </View>

              {/* Text */}
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                <View style={[styles.badge, { borderColor: option.badgeColor }]}>
                  <Text style={[styles.badgeText, { color: option.badgeColor }]}>
                    {option.badge}
                  </Text>
                </View>
              </View>

              {/* Radio */}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Get Started Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get $tarted →</Text>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dollarIcon: {
    fontSize: 40,
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
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2E2E33',
    borderRadius: 2,
    marginBottom: 28,
  },
  progressFill: {
    height: 4,
    width: '50%',
    backgroundColor: '#C9A84C',
    borderRadius: 2,
  },
  sectionHeading: {
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E33',
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: '#C9A84C',
    backgroundColor: '#1E1C14',
  },
  iconBox: {
    width: 52,
    height: 52,
    backgroundColor: '#2E2E33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionEmoji: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
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
  radioSelected: {
    borderColor: '#C9A84C',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C9A84C',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
  buttonDisabled: {
    backgroundColor: '#2E2E33',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E0E0F',
  },
});