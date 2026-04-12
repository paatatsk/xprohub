import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

// Screen 8 — Worker Match
// Auto-matched worker shown, one tap to confirm.
// Match Score % from 4-factor algorithm (Location 25% / Skill 35% / Belt 20% / Behavioral 20%).
// TODO Phase 2: pull from worker_match_scores VIEW

export default function MatchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>YOUR MATCH</Text>
      <Text style={styles.sub}>TODO: worker_match_scores VIEW → bids table</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title:     { color: Colors.gold, fontSize: 28, fontWeight: 'bold' },
  sub:       { color: Colors.textSecondary, marginTop: 8 },
});
