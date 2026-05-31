// app/(tabs)/desk.tsx
// Desk tab — placeholder for Slice A. Real ledger surface lands in Slice D.
// Per NAV_SPEC.md §3: Desk = my workspace (active jobs, earnings, history, payouts).

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../constants/theme';

export default function DeskScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.center}>
        <Text style={s.eyebrow}>DESK {'\u00b7'} YOUR WORKSPACE</Text>
        <Text style={s.title}>Your desk.</Text>
        <Text style={s.body}>Your workspace will live here.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  eyebrow: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.gold,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
