// components/DetailHeader.tsx
// Shared JS header for root-Stack detail screens.
// Replaces the native-stack UINavigationBar header (which adds an
// iOS 26 circular pill behind headerLeft) with a JS-rendered header
// visually identical to the Tabs JS header used elsewhere in the app.

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../constants/theme';

interface DetailHeaderProps {
  title: string;
  showBack?: boolean;
}

export function DetailHeader({ title, showBack = true }: DetailHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <View style={styles.chevron} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {/* Spacer to keep title centered */}
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  backBtn: {
    width: 44,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  chevron: {
    width: 14,
    height: 14,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
});
