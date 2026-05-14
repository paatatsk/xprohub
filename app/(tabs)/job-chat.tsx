// app/(tabs)/job-chat.tsx
// Screen — Realtime-powered chat thread between customer and worker.
// Replaces the placeholder. Param: chat_id (uuid, required).
// worker_name and first_message params are intentionally ignored —
// identities are loaded from the chats row directly.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatProfile {
  id: string;
  full_name: string | null;
}

interface ChatRow {
  id: string;
  customer_id: string;
  worker_id: string;
  customer: ChatProfile | null;
  worker: ChatProfile | null;
  job: { id: string; title: string | null; status: string } | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ── Time formatter ─────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const date  = new Date(iso);
  const now   = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth() &&
    date.getDate()     === now.getDate();

  const hours   = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm    = hours >= 12 ? 'pm' : 'am';
  const h       = hours % 12 || 12;
  const timeStr = `${h}:${minutes} ${ampm}`;

  if (isToday) return timeStr;

  const month = date.toLocaleString('default', { month: 'short' });
  const day   = date.getDate();
  return `${month} ${day}, ${timeStr}`;
}

// ── MessageBubble ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
}

function MessageBubble({ message, isOutgoing }: MessageBubbleProps) {
  return (
    <View style={[
      styles.bubbleRow,
      isOutgoing ? styles.bubbleRowOutgoing : styles.bubbleRowIncoming,
    ]}>
      <View style={[
        styles.bubble,
        isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
      ]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
        <Text style={styles.bubbleTime}>{formatMessageTime(message.created_at)}</Text>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function JobChatScreen() {
  const router                    = useRouter();
  const { chat_id }               = useLocalSearchParams<{ chat_id: string }>();
  const listRef                   = useRef<FlatList<Message>>(null);

  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [chat,          setChat]          = useState<ChatRow | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [composerText,  setComposerText]  = useState('');
  const [sending,       setSending]       = useState(false);
  const [sendError,     setSendError]     = useState<string | null>(null);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [actionError,     setActionError]     = useState<string | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!chat_id) {
      setLoadError('No chat specified.');
      setLoading(false);
      return;
    }

    (async () => {
      // Step 1 — current user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setLoadError('You must be signed in to view this chat.');
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Step 2 — fetch chat row with both profiles + job title
      const { data: chatData, error: chatErr } = await supabase
        .from('chats')
        .select(`
          id, customer_id, worker_id, job_id,
          customer:profiles!customer_id(id, full_name),
          worker:profiles!worker_id(id, full_name),
          job:jobs!job_id(id, title, status)
        `)
        .eq('id', chat_id)
        .single();

      if (chatErr || !chatData) {
        setLoadError('Chat not found or no longer available.');
        setLoading(false);
        return;
      }

      // Step 3 — auth guard
      const isParty =
        user.id === chatData.customer_id ||
        user.id === chatData.worker_id;

      if (!isParty) {
        setLoadError('NOT_AUTHORIZED');
        setLoading(false);
        return;
      }

      setChat(chatData as unknown as ChatRow);

      // Step 4 — load message history (chronological ASC)
      const { data: msgRows, error: msgErr } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (!msgErr) {
        setMessages((msgRows ?? []) as Message[]);
      }
      // If msgErr: show empty list — non-fatal, Realtime will still work

      // Step 5 — check if current user has already reviewed this job
      const jobId = (chatData as any).job_id as string | undefined;
      if (jobId) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('job_id', jobId)
          .eq('reviewer_id', user.id)
          .maybeSingle();

        if (existingReview) {
          setUserHasReviewed(true);
        }
      }

      setLoading(false);
    })();
  }, [chat_id]);

  // Re-check review status when screen regains focus (fixes stale state
  // after submitting a review and navigating back — POLISH_PASS #2)
  useFocusEffect(
    useCallback(() => {
      if (!chat?.job?.id || !currentUserId) return;

      (async () => {
        const { data } = await supabase
          .from('reviews')
          .select('id')
          .eq('job_id', chat.job!.id)
          .eq('reviewer_id', currentUserId)
          .maybeSingle();

        setUserHasReviewed(!!data);
      })();
    }, [chat?.job?.id, currentUserId])
  );

  // ── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    // Only subscribe after initial load confirms the user is a party
    if (loading || loadError || !chat_id) return;

    const channel = supabase
      .channel(`messages:${chat_id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `chat_id=eq.${chat_id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev =>
            prev.some(m => m.id === newMsg.id)
              ? prev
              : [...prev, newMsg]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loading, loadError, chat_id]);

  // ── Send handler ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = composerText.trim();
    if (!trimmed || !currentUserId || !chat_id) return;

    setSending(true);
    setSendError(null);

    const { error: insertErr } = await supabase
      .from('messages')
      .insert({
        chat_id,
        sender_id:    currentUserId,
        content:      trimmed,
        message_type: 'text',
      });

    if (insertErr) {
      setSendError(insertErr.message);
      setSending(false);
      return;
      // composerText preserved — user can retry
    }

    // Success — Realtime subscription appends the new row to messages state
    setComposerText('');
    setSending(false);
  }, [composerText, currentUserId, chat_id]);

  // ── Refetch job status ────────────────────────────────────────────────────

  const refetchJobStatus = useCallback(async () => {
    if (!chat?.job?.id) return;
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('id', chat.job.id)
      .single();
    if (!error && data) {
      setChat(prev => prev ? { ...prev, job: data } : prev);
    }
  }, [chat]);

  // ── Lifecycle handlers ────────────────────────────────────────────────────

  const handleMarkInProgress = useCallback(() => {
    if (!chat?.job?.id) return;
    Alert.alert(
      'Mark In Progress',
      'Mark this job as in progress? Both you and the other party will see the update.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark in progress',
          onPress: async () => {
            setActionLoading(true);
            setActionError(null);
            const { error } = await supabase.rpc('mark_in_progress', { p_job_id: chat.job!.id });
            if (error) {
              setActionError(error.message);
            } else {
              await refetchJobStatus();
            }
            setActionLoading(false);
          },
        },
      ]
    );
  }, [chat, refetchJobStatus]);

  const handleMarkComplete = useCallback(() => {
    if (!chat?.job?.id) return;
    Alert.alert(
      'Mark Completed',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: async () => {
            setActionLoading(true);
            setActionError(null);
            const { error } = await supabase.rpc('mark_completed', { p_job_id: chat.job!.id });
            if (error) {
              setActionError(error.message);
            } else {
              await refetchJobStatus();
            }
            setActionLoading(false);
          },
        },
      ]
    );
  }, [chat, refetchJobStatus]);

  const handleLeaveReview = useCallback(() => {
    if (!chat?.job?.id || !currentUserId) return;
    const revieweeId   = currentUserId === chat.customer_id
      ? chat.worker_id
      : chat.customer_id;
    const revieweeName = currentUserId === chat.customer_id
      ? chat.worker?.full_name ?? ''
      : chat.customer?.full_name ?? '';
    const jobTitle = chat.job.title ?? '';

    router.push(
      `/(tabs)/review?job_id=${chat.job.id}` +
      `&reviewee_id=${revieweeId}` +
      `&reviewee_name=${encodeURIComponent(revieweeName)}` +
      `&job_title=${encodeURIComponent(jobTitle)}` as any
    );
  }, [chat, currentUserId, router]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (loadError === 'NOT_AUTHORIZED') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <Text style={styles.stateGlyph}>🔒</Text>
          <Text style={styles.stateHeading}>NOT AUTHORIZED</Text>
          <Text style={styles.stateSub}>You are not a participant in this conversation.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Generic error ─────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerBox}>
          <Text style={styles.stateGlyph}>⚠️</Text>
          <Text style={styles.stateHeading}>COULDN'T LOAD CHAT</Text>
          <Text style={styles.stateSub}>{loadError}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const otherParty = currentUserId === chat?.customer_id
    ? chat?.worker
    : chat?.customer;

  const otherName  = otherParty?.full_name ?? 'User';
  const jobTitle   = chat?.job?.title ?? null;
  const jobStatus  = chat?.job?.status ?? null;

  // ── Main JSX ──────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>

        {/* ── Header context strip ── */}
        <View style={styles.contextStrip}>
          <Text style={styles.contextName} numberOfLines={1}>{otherName}</Text>
          {jobTitle ? (
            <Text style={styles.contextJob} numberOfLines={1}>About: {jobTitle}</Text>
          ) : null}
        </View>

        {/* ── Lifecycle banner ── */}
        {jobStatus === 'matched' && (
          <View style={styles.lifecycleBanner}>
            {actionLoading
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : (
                <TouchableOpacity
                  style={styles.lifecycleBtn}
                  onPress={handleMarkInProgress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.lifecycleBtnText}>MARK IN PROGRESS</Text>
                </TouchableOpacity>
              )
            }
            {actionError ? (
              <Text style={{ color: Colors.red, fontSize: 11, textAlign: 'center' }}>
                {actionError}
              </Text>
            ) : null}
          </View>
        )}

        {jobStatus === 'in_progress' && (
          <View style={styles.lifecycleBanner}>
            {actionLoading
              ? <ActivityIndicator size="small" color={Colors.green} />
              : (
                <TouchableOpacity
                  style={[styles.lifecycleBtn, { borderColor: Colors.green }]}
                  onPress={handleMarkComplete}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.lifecycleBtnText, { color: Colors.green }]}>
                    MARK COMPLETED
                  </Text>
                </TouchableOpacity>
              )
            }
            {actionError ? (
              <Text style={{ color: Colors.red, fontSize: 11, textAlign: 'center' }}>
                {actionError}
              </Text>
            ) : null}
          </View>
        )}

        {jobStatus === 'completed' && (
          <View style={styles.lifecycleBanner}>
            {userHasReviewed ? (
              <View style={styles.lifecycleStaticBadgeCompleted}>
                <Text style={styles.lifecycleStaticText}>✓ REVIEW SUBMITTED</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.lifecycleBtn}
                onPress={handleLeaveReview}
                activeOpacity={0.85}
              >
                <Text style={styles.lifecycleBtnText}>LEAVE A REVIEW</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {(jobStatus === 'cancelled' || jobStatus === 'canceled') && (
          <View style={styles.lifecycleBanner}>
            <View style={styles.lifecycleStaticBadgeCancelled}>
              <Text style={styles.lifecycleStaticText}>JOB CANCELLED</Text>
            </View>
          </View>
        )}

        {/* ── Messages list ── */}
        <FlatList
          ref={listRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOutgoing={item.sender_id === currentUserId}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />

        {/* ── Send error banner ── */}
        {sendError ? (
          <View style={styles.sendErrorBanner}>
            <Text style={styles.sendErrorText} numberOfLines={2}>{sendError}</Text>
            <TouchableOpacity onPress={() => setSendError(null)}>
              <Text style={styles.sendErrorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Composer ── */}
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={composerText}
            onChangeText={setComposerText}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (sending || !composerText.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending || !composerText.trim()}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.background} />
              : <Text style={styles.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Layout ────────────────────────────────────────────────────
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  // ── State screens (loading / error / auth guard) ───────────────
  stateGlyph: {
    fontSize: 40,
  },
  stateHeading: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  stateSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  backBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  backBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },

  // ── Header context strip ───────────────────────────────────────
  contextStrip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 2,
  },
  contextName: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },
  contextJob: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // ── Lifecycle banner ──────────────────────────────────────────
  lifecycleBanner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: 6,
  },
  lifecycleBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  lifecycleBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  lifecycleStaticBadge: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  lifecycleStaticBadgeCompleted: {
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  lifecycleStaticBadgeCancelled: {
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  lifecycleStaticText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },

  // ── Empty state ────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },

  // ── Message bubbles ────────────────────────────────────────────
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bubbleRowOutgoing: {
    justifyContent: 'flex-end',
  },
  bubbleRowIncoming: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 4,
  },
  bubbleOutgoing: {
    backgroundColor: Colors.gold + '22',
    borderColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleIncoming: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    color: Colors.textSecondary,
    fontSize: 11,
    alignSelf: 'flex-end',
  },

  // ── Send error banner ──────────────────────────────────────────
  sendErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.red,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
  },
  sendErrorText: {
    flex: 1,
    color: Colors.red,
    fontSize: 12,
    lineHeight: 17,
  },
  sendErrorDismiss: {
    color: Colors.textSecondary,
    fontSize: 16,
    paddingHorizontal: 4,
  },

  // ── Composer ──────────────────────────────────────────────────
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});
