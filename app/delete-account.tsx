// app/delete-account.tsx
// Screen: DELETE ACCOUNT — confirmation + execution
// Moved from inline handler in account.tsx for deliberate friction.

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useBiometrics } from '../hooks/useBiometrics';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { clearCredentials } = useBiometrics();
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDelete() {
    Alert.alert(
      'This cannot be undone.',
      'Your profile, posts, and applications will be permanently deleted. Payment records are retained as required. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { data, error: fnError } = await supabase.functions.invoke(
                'delete-account',
                { body: {} },
              );

              if (fnError) {
                try {
                  const body = await (fnError as any).context?.json?.();
                  if (body?.error === 'active_jobs' || body?.error === 'held_payments') {
                    Alert.alert('Active Commitments', body.message);
                    return;
                  }
                  if (body?.error) {
                    Alert.alert(
                      'Deletion Failed',
                      body.message ?? 'Account deletion could not be completed. Please try again or contact hello@xprohub.com.',
                    );
                    return;
                  }
                } catch {
                  // context parsing failed
                }
                Alert.alert(
                  'Connection Error',
                  "Couldn't reach our servers. Check your connection and try again.",
                );
                return;
              }

              if (data?.error === 'active_jobs' || data?.error === 'held_payments') {
                Alert.alert('Active Commitments', data.message);
                return;
              }

              if (data?.error) {
                Alert.alert(
                  'Deletion Failed',
                  data.message ?? 'Account deletion could not be completed. Please try again or contact hello@xprohub.com.',
                );
                return;
              }

              // Success — sign out, clear biometrics, route to welcome
              await supabase.auth.signOut();
              await clearCredentials();
              router.replace('/(onboarding)/welcome');
            } catch {
              Alert.alert(
                'Deletion Failed',
                'Something went wrong. Please try again or contact hello@xprohub.com.',
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>

        <Text style={styles.title}>DELETE ACCOUNT</Text>

        <Text style={styles.body}>
          This permanently deletes your profile, posts, and applications. Payment records are retained as required by law.
        </Text>
        <Text style={styles.body}>
          This action cannot be undone.
        </Text>

        <TouchableOpacity
          style={[styles.deleteBtn, isDeleting && { opacity: 0.5 }]}
          onPress={handleDelete}
          activeOpacity={0.7}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.deleteBtnText}>DELETE MY ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>CANCEL</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    gap: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  deleteBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
});
