import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0E0F' },
          animation: 'fade',
        }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="post-job" />
        <Stack.Screen name="job-posted" />
        <Stack.Screen name="worker-match" />
        <Stack.Screen name="worker-profile" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="payment-success" />
        <Stack.Screen name="review" />
        <Stack.Screen name="command-center" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="dev-menu" />
        <Stack.Screen name="my-profile" />
      </Stack>
    </>
  );
}