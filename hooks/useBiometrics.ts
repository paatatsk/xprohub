import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stored in iOS Keychain via expo-secure-store.
// Hardware-encrypted, not included in device backups.
// AsyncStorage import retained for defensive cleanup only.
const CREDS_KEY = 'xprohub_biometric_creds';

interface StoredCredentials {
  email: string;
  password: string;
}

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    async function check() {
      // Defensive cleanup: erase any plaintext credentials that might exist
      // in AsyncStorage from the pre-SecureStore version of this hook.
      // Cheap no-op after the first run (removeItem on a missing key returns
      // without error). Runs every mount intentionally — costs ~1ms and
      // guarantees no plaintext lingers if the file ever reverts.
      try { await AsyncStorage.removeItem(CREDS_KEY); } catch {}

      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hardware && enrolled);

      const stored = await SecureStore.getItemAsync(CREDS_KEY);
      setHasCredentials(stored !== null);
    }
    check();
  }, []);

  async function authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to XProHub',
      fallbackLabel: 'Use password instead',
      disableDeviceFallback: false,
    });
    return result.success;
  }

  async function saveCredentials(email: string, password: string): Promise<void> {
    // SecureStore defaults are correct here: AFTER_FIRST_UNLOCK accessibility,
    // no requireAuthentication. Biometric prompt is handled by the caller via
    // LocalAuthentication.authenticateAsync() — adding requireAuthentication
    // here would double-prompt.
    await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }));
    setHasCredentials(true);
  }

  async function getCredentials(): Promise<StoredCredentials | null> {
    const stored = await SecureStore.getItemAsync(CREDS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredCredentials;
  }

  async function clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(CREDS_KEY);
    setHasCredentials(false);
  }

  return { isAvailable, hasCredentials, authenticate, saveCredentials, getCredentials, clearCredentials };
}
