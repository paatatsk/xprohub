import { Redirect } from 'expo-router';

export default function StripeReturn() {
  return <Redirect href="/(tabs)/stripe-connect" />;
}
