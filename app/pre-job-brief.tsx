import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';

const JOB = {
  title: 'Deep Cleaning',
  icon: '🏠',
  customerName: 'Marcus Johnson',
  customerAvatar: 'M',
  customerRating: 4.9,
  customerJobs: 12,
  customerVerified: true,
  address: '123 Park Ave, Manhattan',
  apartment: 'Apt 4B — Ring buzzer #12',
  startTime: 'Tomorrow at 10:00 AM',
  duration: '3 hours estimated',
  rate: '$35/hr',
  estimatedTotal: '$105.00',
  specialInstructions: 'Please bring your own cleaning supplies. The dog is friendly — his name is Max. Focus especially on the kitchen and both bathrooms.',
  requirements: ['Own cleaning supplies', 'Non-slip shoes recommended', 'COVID mask appreciated'],
  jobId: 'XPH-2026-04821',
};

export default function PreJobBriefScreen() {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleCheck = (index: number) => {
    setCheckedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const allChecked = checkedItems.length === JOB.requirements.length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Briefing</Text>
        <View style={styles.jobIdBadge}>
          <Text style={styles.jobIdText}>#{JOB.jobId.slice(-5)}</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Ready Banner */}
        <View style={styles.readyBanner}>
          <Text style={styles.readyIcon}>{JOB.icon}</Text>
          <View style={styles.readyInfo}>
            <Text style={styles.readyTitle}>{JOB.title}</Text>
            <Text style={styles.readySubtitle}>Everything you need before you arrive</Text>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>YOUR CUSTOMER</Text>
        </View>
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>{JOB.customerAvatar}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{JOB.customerName}</Text>
            <Text style={styles.customerMeta}>
              ★ {JOB.customerRating} · {JOB.customerJobs} jobs posted
            </Text>
            <View style={styles.customerTags}>
              {JOB.customerVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✅ Verified</Text>
                </View>
              )}
              <View style={styles.escrowBadge}>
                <Text style={styles.escrowText}>🛡️ Escrow Protected</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => router.push('/chat')}>
            <Text style={styles.messageBtnText}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>LOCATION</Text>
        </View>
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>{JOB.address}</Text>
              <Text style={styles.locationApartment}>{JOB.apartment}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.85}>
            <Text style={styles.navigateBtnText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Timing & Pay */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>TIMING & PAY</Text>
        </View>
        <View style={styles.timingCard}>
          <View style={styles.timingRow}>
            <View style={styles.timingItem}>
              <Text style={styles.timingIcon}>⏰</Text>
              <Text style={styles.timingLabel}>Start Time</Text>
              <Text style={styles.timingValue}>{JOB.startTime}</Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingItem}>
              <Text style={styles.timingIcon}>⏱</Text>
              <Text style={styles.timingLabel}>Duration</Text>
              <Text style={styles.timingValue}>{JOB.duration}</Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingItem}>
              <Text style={styles.timingIcon}>💰</Text>
              <Text style={styles.timingLabel}>Est. Total</Text>
              <Text style={[styles.timingValue, { color: '#C9A84C' }]}>{JOB.estimatedTotal}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>CUSTOMER NOTE</Text>
        </View>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsIcon}>📝</Text>
          <Text style={styles.instructionsText}>{JOB.specialInstructions}</Text>
        </View>

        {/* Requirements Checklist */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>BEFORE YOU GO — CHECK THESE OFF</Text>
        </View>
        <View style={styles.checklistCard}>
          {JOB.requirements.map((req, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.checkItem,
                checkedItems.includes(index) && styles.checkItemDone,
              ]}
              onPress={() => toggleCheck(index)}
              activeOpacity={0.7}>
              <View style={[
                styles.checkbox,
                checkedItems.includes(index) && styles.checkboxDone,
              ]}>
                {checkedItems.includes(index) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[
                styles.checkText,
                checkedItems.includes(index) && styles.checkTextDone,
              ]}>
                {req}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Note */}
        <View style={styles.safetyCard}>
          <Text style={styles.safetyText}>
            🚨 Emergency SOS is always available from your Active Job screen
          </Text>
        </View>

        {/* Clock In Button */}
        <TouchableOpacity
          style={[
            styles.clockInBtn,
            !allChecked && styles.clockInBtnDisabled,
          ]}
          onPress={() => router.push('/active-job')}
          activeOpacity={0.85}>
          <Text style={[
            styles.clockInBtnText,
            !allChecked && { color: '#555558' },
          ]}>
            {allChecked ? '⏰ I\'m Ready — Clock In' : `Check off all items to continue (${checkedItems.length}/${JOB.requirements.length})`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E0F' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12,
  },
  backBtn: { paddingVertical: 6, paddingRight: 8 },
  backBtnText: { color: '#C9A84C', fontSize: 14, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#E8E8EA' },
  jobIdBadge: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  jobIdText: { fontSize: 11, color: '#888890', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  readyBanner: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  readyIcon: { fontSize: 36 },
  readyInfo: { flex: 1 },
  readyTitle: { fontSize: 18, fontWeight: '800', color: '#E8E8EA' },
  readySubtitle: { fontSize: 12, color: '#888890', marginTop: 3 },

  sectionLabel: { marginTop: 6 },
  sectionLabelText: {
    fontSize: 10, fontWeight: '700', color: '#888890',
    letterSpacing: 1.5, marginBottom: -2,
  },

  customerCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  customerAvatar: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#4A9EDB',
    alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { fontSize: 20, fontWeight: '800', color: '#0E0E0F' },
  customerInfo: { flex: 1, gap: 6 },
  customerName: { fontSize: 16, fontWeight: '800', color: '#E8E8EA' },
  customerMeta: { fontSize: 12, color: '#888890' },
  customerTags: { flexDirection: 'row', gap: 6 },
  verifiedBadge: {
    backgroundColor: 'rgba(76,175,122,0.12)',
    borderWidth: 1, borderColor: 'rgba(76,175,122,0.3)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  verifiedText: { fontSize: 10, color: '#4CAF7A', fontWeight: '700' },
  escrowBadge: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  escrowText: { fontSize: 10, color: '#C9A84C', fontWeight: '700' },
  messageBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#0E0E0F', borderWidth: 1, borderColor: '#2E2E33',
    alignItems: 'center', justifyContent: 'center',
  },
  messageBtnText: { fontSize: 18 },

  locationCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 12,
  },
  locationRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  locationIcon: { fontSize: 20 },
  locationInfo: { flex: 1 },
  locationAddress: { fontSize: 15, fontWeight: '700', color: '#E8E8EA' },
  locationApartment: { fontSize: 12, color: '#888890', marginTop: 3 },
  navigateBtn: {
    backgroundColor: 'rgba(85,153,224,0.1)',
    borderWidth: 1, borderColor: 'rgba(85,153,224,0.3)',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  navigateBtnText: { fontSize: 14, color: '#5599E0', fontWeight: '700' },

  timingCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16,
  },
  timingRow: { flexDirection: 'row', alignItems: 'center' },
  timingItem: { flex: 1, alignItems: 'center', gap: 4 },
  timingIcon: { fontSize: 20 },
  timingLabel: { fontSize: 9, color: '#888890', fontWeight: '700', textTransform: 'uppercase' },
  timingValue: { fontSize: 12, fontWeight: '700', color: '#E8E8EA', textAlign: 'center' },
  timingDivider: { width: 1, height: 40, backgroundColor: '#2E2E33' },

  instructionsCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  instructionsIcon: { fontSize: 20 },
  instructionsText: { flex: 1, fontSize: 13, color: '#CCCCCC', lineHeight: 20 },

  checklistCard: {
    backgroundColor: '#171719', borderWidth: 1, borderColor: '#2E2E33',
    borderRadius: 20, padding: 16, gap: 10,
  },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8, paddingHorizontal: 4,
  },
  checkItemDone: { opacity: 0.7 },
  checkbox: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 2, borderColor: '#2E2E33',
    backgroundColor: '#0E0E0F',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#4CAF7A', borderColor: '#4CAF7A' },
  checkmark: { fontSize: 14, color: '#0E0E0F', fontWeight: '800' },
  checkText: { fontSize: 14, color: '#E8E8EA', flex: 1 },
  checkTextDone: { color: '#888890', textDecorationLine: 'line-through' },

  safetyCard: {
    backgroundColor: 'rgba(224,82,82,0.06)',
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.2)',
    borderRadius: 14, padding: 12,
  },
  safetyText: { fontSize: 12, color: '#E05252', textAlign: 'center', fontWeight: '600' },

  clockInBtn: {
    backgroundColor: '#C9A84C', borderRadius: 18,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  clockInBtnDisabled: {
    backgroundColor: '#1E1E21', borderWidth: 1, borderColor: '#2E2E33',
    shadowOpacity: 0, elevation: 0,
  },
  clockInBtnText: { fontSize: 16, fontWeight: '800', color: '#0E0E0F' },
});