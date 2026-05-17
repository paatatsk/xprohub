import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

export function useBlockList() {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBlockedIds([]);
      setCurrentUserId(null);
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    setBlockedIds((data ?? []).map(r => r.blocked_id));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh on screen focus — catches blocks made on other screens
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return { blockedIds, currentUserId, loading, refresh };
}
