import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';

// Tab bar hidden — navigation happens via home screen hub, not a visible tab bar.
// Tabs are registered here so Expo Router knows they exist.

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="belt" />
      <Tabs.Screen name="match" />
      <Tabs.Screen name="payment" />
      <Tabs.Screen name="review" />
    </Tabs>
  );
}
