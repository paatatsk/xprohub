// app/(tabs)/report.tsx
// Screen: REPORT — User/content reporting flow (G-4)
// Params: reported_user_id, content_type, content_id, reported_user_name

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';

export default function ReportScreen() {
  const {
    reported_user_id,
    content_type,
    content_id,
    reported_user_name,
  } = useLocalSearchParams<{
    reported_user_id: string;
    content_type: string;
    content_id?: string;
    reported_user_name?: string;
  }>();

  const displayName = reported_user_name
    ? decodeURIComponent(reported_user_name)
    : 'User';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>REPORT</Text>
        <Text style={styles.heading}>Reporting {displayName}</Text>
        <Text style={styles.sub}>
          Type: {content_type ?? 'user'}
          {content_id ? `\nContent ID: ${content_id}` : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  eyebrow: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
