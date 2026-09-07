import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly at startup on a misconfigured build. These EXPO_PUBLIC_ vars are
// inlined at build time — locally from .env, on EAS from the environment's
// variables (see eas.json profiles). If a build ships without them, every
// Supabase call fails silently; a crash with this message is far easier to
// diagnose than an app that limps.
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
    !supabaseAnonKey && 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');
  throw new Error(
    `[supabase] Missing required env var(s): ${missing}. ` +
    `Local dev reads these from .env; EAS builds need them set for the ` +
    `build profile (dashboard env vars or eas.json > build.<profile>.env).`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
