import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>XProHub</Text>
      <Text style={styles.tagline}>Built with purpose.</Text>
      <Text style={styles.tagline}>Designed for people.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#C9A84C',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#888890',
    fontStyle: 'italic',
  },
});
