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
          XProHub is a professional marketplace built on respect. Every person here is doing real work or hiring for it, and everyone deserves to be treated with dignity. These guidelines apply to everything on the platform — posts, profiles, photos, and messages.
        </Text>

        <Text style={styles.subheading}>Zero tolerance for abuse</Text>
        <Text style={styles.body}>
          We have zero tolerance for objectionable content and abusive behavior. Harassment, threats, hate speech, discrimination, sexual content, and content that is deceptive or illegal are not allowed anywhere on XProHub. Content that violates these guidelines may be removed, and accounts that violate them may be suspended or permanently removed.
        </Text>

        <Text style={styles.subheading}>Report and block</Text>
        <Text style={styles.body}>
          Every profile, job post, and chat has a report option — if you see something that breaks these guidelines, report it and our team will review it promptly. You can also block any user, which removes their posts and profile from your view. Blocked users are managed from your Account screen.
        </Text>

        <Text style={styles.subheading}>Meet safely</Text>
        <Text style={styles.body}>
          Jobs on XProHub happen in the real world. Use your judgment: communicate through the app before meeting, be cautious with home access, and if something feels wrong, don't proceed. XProHub does not conduct background checks or verify credentials — evaluating who you work with is up to you.
        </Text>

        <Text style={styles.subheading}>Keep payment on the platform</Text>
        <Text style={styles.body}>
          Escrow is your protection: the customer's money is held until the work is confirmed. Taking payment off the platform removes that protection for both sides and violates our Terms of Service.
        </Text>

        <Text style={styles.subheading}>Licensed work</Text>
        <Text style={styles.body}>
          Some work legally requires a license or certification. If you offer that kind of work, it's your responsibility to hold the credentials the law requires. If you're hiring for it, ask.
        </Text>

        <Text style={styles.body}>
          We want XProHub to stay a place people are glad to be. Questions or something to report? Contact us at{' '}
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
