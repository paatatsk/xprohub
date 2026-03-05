import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'worker',
    text: 'Hi! I saw your deep cleaning job posting. I am available today and can be there within 30 minutes! 😊',
    time: '3:45 PM',
    read: true,
  },
  {
    id: 2,
    sender: 'customer',
    text: 'That sounds great Sofia! It is a 2 bedroom apartment. Should take about 3 hours.',
    time: '3:47 PM',
    read: true,
  },
  {
    id: 3,
    sender: 'worker',
    text: 'Perfect! I bring all my own eco-friendly supplies. The total would be $75 for 3 hours at my $25/hr rate. Does that work for you?',
    time: '3:48 PM',
    read: true,
  },
  {
    id: 4,
    sender: 'customer',
    text: 'Yes that works! Can you start at 4:30 PM?',
    time: '3:50 PM',
    read: true,
  },
  {
    id: 5,
    sender: 'worker',
    text: '4:30 PM works perfectly! I will see you then. The payment will be held securely by XProHub until the job is complete 🛡️',
    time: '3:51 PM',
    read: true,
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'customer',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Auto reply after 1 second
    setTimeout(() => {
      const reply = {
        id: messages.length + 2,
        sender: 'worker',
        text: 'Got it! See you soon 😊',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.workerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SR</Text>
          </View>
          <View>
            <Text style={styles.workerName}>Sofia Rodriguez</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online · Responds in mins</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hireHeaderBtn}
          onPress={() => router.push('/worker-profile')}>
          <Text style={styles.hireHeaderText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Job Card */}
      <View style={styles.jobCard}>
        <Text style={styles.jobCardIcon}>🧹</Text>
        <View style={styles.jobCardInfo}>
          <Text style={styles.jobCardTitle}>Deep Cleaning · $75 total</Text>
          <Text style={styles.jobCardSub}>Today 4:30 PM · Manhattan, NY</Text>
        </View>
        <TouchableOpacity style={styles.jobCardBtn} onPress={() => router.push('/payment')}>
          <Text style={styles.jobCardBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}>

        {/* Date Divider */}
        <View style={styles.dateDivider}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>Today</Text>
          <View style={styles.dateLine} />
        </View>

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.sender === 'customer' ? styles.messageRowRight : styles.messageRowLeft
            ]}>

            {message.sender === 'worker' && (
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>SR</Text>
              </View>
            )}

            <View style={[
              styles.messageBubble,
              message.sender === 'customer' ? styles.bubbleCustomer : styles.bubbleWorker
            ]}>
              <Text style={[
                styles.messageText,
                message.sender === 'customer' ? styles.messageTextCustomer : styles.messageTextWorker
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.sender === 'customer' ? styles.messageTimeCustomer : styles.messageTimeWorker
              ]}>
                {message.time} {message.sender === 'customer' && '✓✓'}
              </Text>
            </View>

          </View>
        ))}

        {/* Protection Notice */}
        <View style={styles.protectionNotice}>
          <Text style={styles.protectionText}>
            🛡️ This conversation is protected by XProHub. Never share personal contact details.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>

          {/* Quick Replies */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickReplies}
            contentContainerStyle={styles.quickRepliesContent}>
            {['On my way!', 'Job complete ✓', 'Running 5 mins late', 'Thank you!'].map(reply => (
              <TouchableOpacity
                key={reply}
                style={styles.quickReply}
                onPress={() => setInputText(reply)}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#444450"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
              onPress={sendMessage}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E33',
    gap: 12,
  },
  backBtn: { color: '#888890', fontSize: 16 },
  workerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0E0E0F', fontSize: 14, fontWeight: '800' },
  workerName: { fontSize: 15, fontWeight: '700', color: '#E8E8EA' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4CAF7A',
  },
  onlineText: { fontSize: 11, color: '#4CAF7A' },
  hireHeaderBtn: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hireHeaderText: { color: '#C9A84C', fontSize: 12, fontWeight: '700' },

  // Job Card
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  jobCardIcon: { fontSize: 22 },
  jobCardInfo: { flex: 1 },
  jobCardTitle: { fontSize: 13, fontWeight: '700', color: '#C9A84C' },
  jobCardSub: { fontSize: 11, color: '#888890', marginTop: 2 },
  jobCardBtn: {
    backgroundColor: '#C9A84C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  jobCardBtnText: { color: '#0E0E0F', fontSize: 13, fontWeight: '800' },

  // Messages
  messageList: { flex: 1 },
  messageListContent: { padding: 16 },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: '#2E2E33' },
  dateText: { fontSize: 11, color: '#888890' },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageAvatarText: { color: '#0E0E0F', fontSize: 10, fontWeight: '800' },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleWorker: {
    backgroundColor: '#1F1F22',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderBottomLeftRadius: 4,
  },
  bubbleCustomer: {
    backgroundColor: '#C9A84C',
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextWorker: { color: '#E8E8EA' },
  messageTextCustomer: { color: '#0E0E0F' },
  messageTime: { fontSize: 10, marginTop: 4 },
  messageTimeWorker: { color: '#888890' },
  messageTimeCustomer: { color: 'rgba(0,0,0,0.5)' },

  // Protection Notice
  protectionNotice: {
    backgroundColor: 'rgba(201,168,76,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  protectionText: {
    fontSize: 11,
    color: '#888890',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Input Bar
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: '#2E2E33',
    backgroundColor: '#0E0E0F',
    paddingBottom: 32,
  },
  quickReplies: { maxHeight: 40, marginTop: 10 },
  quickRepliesContent: { paddingHorizontal: 16, gap: 8 },
  quickReply: {
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickReplyText: { fontSize: 12, color: '#888890' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#171719',
    borderWidth: 1,
    borderColor: '#2E2E33',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#E8E8EA',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E2E33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#C9A84C',
  },
  sendBtnText: { fontSize: 16, color: '#0E0E0F' },
});