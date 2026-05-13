import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 5;

export function usePaymentMethodStatus() {
  const [added,   setAdded]   = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async () => {
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('stripe_payment_method_added')
      .eq('id', user.id)
      .single();
    if (dbError || !data) {
      setError('Unable to load payment status. Please try again.');
      setLoading(false);
      return;
    }
    setAdded(data.stripe_payment_method_added ?? false);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Cleanup any running poll timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Poll profiles.stripe_payment_method_added until it flips to true.
   * Returns true if the flag flipped, false on timeout.
   */
  const startPolling = useCallback((): Promise<boolean> => {
    // Clear any existing timer to prevent parallel chains
    if (timerRef.current) clearTimeout(timerRef.current);

    return new Promise((resolve) => {
      let attempt = 0;

      const poll = async () => {
        attempt++;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { resolve(false); return; }

        const { data } = await supabase
          .from('profiles')
          .select('stripe_payment_method_added')
          .eq('id', user.id)
          .single();

        if (data?.stripe_payment_method_added) {
          setAdded(true);
          resolve(true);
          return;
        }

        if (attempt >= POLL_MAX_ATTEMPTS) {
          resolve(false);
          return;
        }

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      };

      // First poll after one interval (give the webhook a moment)
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    });
  }, []);

  return { added, loading, error, refresh: fetch, startPolling };
}
