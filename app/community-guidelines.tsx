import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../constants/theme';
import { SUPPORT_EMAIL } from '../lib/legal';

export default function CommunityGuidelinesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Community Guidelines</Text>

        <Text style={styles.body}>
          XProHub is a professional marketplace built on respect. Every person here is doing real work or hiring for it, and everyone deserves to be treated with dignity.
        </Text>

        <Text style={styles.subheading}>Keep it professional</Text>
        <Text style={styles.body}>
          Job posts, applications, and messages should be respectful — no harassment, hate speech, or profanity. It helps everyone here feel safe doing business.
        </Text>

        <Text style={styles.subheading}>No abuse or discrimination</Text>
        <Text style={styles.body}>
          Content that is abusive, harassing, hateful, or discriminatory isn't allowed anywhere on XProHub.
        </Text>

        <Text style={styles.subheading}>Respect the work</Text>
        <Text style={styles.body}>
          This is a place for real jobs and fair pay. Treat the people you hire and work for the way you'd want to be treated.
        </Text>

        <Text style={styles.body}>
          We want XProHub to stay a place people are glad to be. Content that breaks these guidelines may be removed, and accounts that repeatedly or deliberately violate them may be suspended or removed.
        </Text>

        <Text style={styles.body}>
          Questions or something to report? Contact us at{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            {SUPPORT_EMAIL}
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  heading: {
    fontFamily: Fonts.heading,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  subheading: {
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  link: {
    color: Colors.gold,
  },
});
