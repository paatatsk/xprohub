import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DetailHeader } from '../components/DetailHeader';

SplashScreen.preventAutoHideAsync();

const AUTH_TIMEOUT_MS = 3000;

// Stripe publishable key (sandbox). Public by design — safe to embed
// in client code per Stripe docs. Visible in every web integration's
// HTML source. For live-mode rollover: swap pk_test_ for pk_live_
// from the XProHub Stripe dashboard (acct_1TRNSu08l7Que01i).
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51TRNSu08l7Que01i7wSpWjuTyIRYdzJHv3RjJMPtQzjcCSTIMXgnscC85ZyqLnPMbEnnIW23QAgdmYuO9Sne0FFq00vCTmyxqg';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_700Bold, Inter_400Regular, Inter_500Medium });
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const timedOut = useRef(false);

  // Refs keep the timeout closure from reading stale values.
  // Without these, the timeout captures loading=true at mount and ALWAYS
  // fires router.replace even after auth has resolved (~3s flash).
  const loadingRef = useRef(loading);
  const segmentsRef = useRef(segments);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use ref — not the stale closure value — to check real current state.
      if (!loadingRef.current) return; // auth already resolved, nothing to do
      timedOut.current = true;
      // Guard: don't replace if already on welcome
      const segs = segmentsRef.current;
      if (segs[0] === '(onboarding)' && segs[1] === 'welcome') return;
      router.replace('/(onboarding)/welcome');
    }, AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading) return;

    const onSplash = segments[0] === 'splash' || !segments[0];
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';
    // Onboarding screens that authenticated users may legitimately land on
    const onAllowedOnboarding = inOnboarding && (
      segments[1] === 'profile-setup' ||
      segments[1] === 'id'  ||
      segments[1] === 'verify-level-2'
    );

    if (onSplash) return;

    if (!session) {
      // Guard: already on welcome — do nothing, avoids re-mount flash
      if (inOnboarding && segments[1] === 'welcome') return;
      if (!inAuthGroup && !inOnboarding) {
        router.replace('/(onboarding)/welcome');
      }
      return;
    }

    // Denylist pattern: only redirect FROM screens the authenticated user
    // shouldn't be on (auth forms, welcome). Any other route is valid —
    // prevents the whitelist bug where new routes (job/[id], future screens)
    // get redirected back to tabs because they weren't listed.
    if (!inAuthGroup && !(inOnboarding && segments[1] === 'welcome')) return;

    // Authenticated user is on login/signup/welcome — redirect to their
    // real destination. Check Supabase to decide: new user → profile-setup,
    // returning user → tabs.
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (segmentsRef.current[0] === '(tabs)') return;
        if (data?.full_name) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(onboarding)/profile-setup');
        }
      });
  }, [session, loading, segments]);

  return (
    <ErrorBoundary>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="xprohub">
        <StatusBar style="light" backgroundColor="#0E0E0F" />
        <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="job/[id]" />
          <Stack.Screen name="job-chat"          options={{ headerShown: true, header: () => <DetailHeader title="CHAT" /> }} />
          <Stack.Screen name="job-detail"        options={{ headerShown: true, header: () => <DetailHeader title="JOB DETAILS" /> }} />
          <Stack.Screen name="job-bids"          options={{ headerShown: true, header: () => <DetailHeader title="APPLICATIONS" /> }} />
          <Stack.Screen name="my-jobs"           options={{ headerShown: true, header: () => <DetailHeader title="MY JOBS" /> }} />
          <Stack.Screen name="my-applications"   options={{ headerShown: true, header: () => <DetailHeader title="MY APPLICATIONS" /> }} />
          <Stack.Screen name="my-card"           options={{ headerShown: true, header: () => <DetailHeader title="MY ID CARD" /> }} />
          <Stack.Screen name="worker-profile"    options={{ headerShown: true, header: () => <DetailHeader title="WORKER" /> }} />
          <Stack.Screen name="stripe-return"  options={{ headerShown: false }} />
          <Stack.Screen name="stripe-refresh" options={{ headerShown: false }} />
        </Stack>
      </StripeProvider>
    </ErrorBoundary>
  );
}