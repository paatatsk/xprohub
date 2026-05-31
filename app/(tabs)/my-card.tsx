// app/(tabs)/my-card.tsx
// My ID Card — Worker self-view of their credential
// Design spec: docs/my-card/MY_CARD_SPEC.md (Revision 02)
// Copy source: docs/my-card/copy.md

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Modal, Pressable, TextInput,
  PanResponder, AccessibilityInfo, ActionSheetIOS,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { strings } from '../../constants/strings';
import { supabase } from '../../lib/supabase';
import WorkerCardComponent, { type Worker } from '../../components/WorkerCard';

// ── Types ──────────────────────────────────────────────────────

type WorkerStatus = 'offline' | 'available' | 'booked';

interface RosterSkill {
  name: string;
  taskId: number;
  categoryId: number;
  isFeatured: boolean;
}

interface TaskCategory {
  id: number;
  name: string;
  icon_slug: string;
  sort_order: number;
}

interface TaskItem {
  id: number;
  name: string;
  category_id: number;
}

interface UndoSnapshot {
  status: WorkerStatus;
  todaySkills: string[];
  rateMin: number;
  rateMax: number;
  radiusMi: number;
}

// ── Constants ──────────────────────────────────────────────────

const RATE_MIN = 15;
const RATE_MAX = 100;
const RATE_STEP = 5;
const RADIUS_MIN = 1;
const RADIUS_MAX = 25;
const RADIUS_STEP = 1;
const SKILL_CAP = 8;
const UNDO_WINDOW_MS = 5000;
const INK = '#1A0F00';
const CHARCOAL = '#2a2a2e';
const THUMB_SIZE = 24;
const THUMB_ACTIVE_SIZE = 34;

// ── Helpers ────────────────────────────────────────────────────

function iconForSlug(slug: string): string {
  const map: Record<string, string> = {
    'home-cleaning': '\uD83E\uDDF9', 'errands-delivery': '\uD83D\uDCE6',
    'pet-care': '\uD83D\uDC15', 'child-care': '\uD83D\uDC76',
    'elder-care': '\uD83E\uDDD3', 'moving-labor': '\uD83D\uDE9A',
    'tutoring': '\uD83D\uDCDA', 'coaching': '\uD83C\uDFC6',
    'personal-asst': '\uD83D\uDDC2\uFE0F', 'vehicle-care': '\uD83D\uDE97',
    'handyman': '\uD83D\uDD28', 'gardening': '\uD83C\uDF3F',
    'trash-recycling': '\u267B\uFE0F', 'events': '\uD83C\uDF89',
    'electrical': '\u26A1', 'plumbing': '\uD83D\uDD27',
    'painting': '\uD83C\uDFA8', 'carpentry': '\uD83E\uDE9A',
    'it-tech': '\uD83D\uDCBB', 'hvac': '\u2744\uFE0F',
  };
  return map[slug] ?? '\u25AA';
}

function getGreeting(firstName: string | null, isNewWorker: boolean): string {
  if (isNewWorker) return `Welcome, ${firstName ?? 'there'}.`;
  const hour = new Date().getHours();
  const name = firstName ?? 'there';
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 18) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'a while ago';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function clockTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function editionDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${day}\u00b7${months[d.getMonth()]}\u00b7${d.getFullYear()}`;
}

function snap(value: number, step: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value / step) * step));
}

// ── Status Segment ─────────────────────────────────────────────

const SEGMENT_STATES: WorkerStatus[] = ['offline', 'available', 'booked'];
const SEGMENT_LABELS = [strings['status.offline'], strings['status.available'], strings['status.booked']];
const SEGMENT_COLORS: Record<WorkerStatus, string> = {
  offline: CHARCOAL,
  available: Colors.green,
  booked: Colors.amber,
};

function StatusSegment({
  value, onChange, disabled,
}: {
  value: WorkerStatus;
  onChange: (s: WorkerStatus) => void;
  disabled?: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(SEGMENT_STATES.indexOf(value))).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [segWidth, setSegWidth] = useState(0);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: SEGMENT_STATES.indexOf(value),
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [value, slideAnim]);

  useEffect(() => {
    if (value === 'available') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(0);
  }, [value, pulseAnim]);

  const indicatorColor = SEGMENT_COLORS[value];
  const oneThird = segWidth / 3;

  return (
    <View
      style={s.segOuter}
      onLayout={(e: LayoutChangeEvent) => setSegWidth(e.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
      accessibilityLabel="Worker status"
    >
      {/* Sliding indicator */}
      {segWidth > 0 && (
        <Animated.View
          style={[
            s.segIndicator,
            {
              width: oneThird,
              backgroundColor: indicatorColor,
              transform: [{ translateX: Animated.multiply(slideAnim, oneThird) }],
            },
            value === 'available' && {
              shadowColor: Colors.green,
              shadowOpacity: 0.4,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            },
            value === 'booked' && {
              shadowColor: Colors.amber,
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      )}

      {SEGMENT_STATES.map((state, i) => {
        const isSelected = value === state;
        return (
          <TouchableOpacity
            key={state}
            style={s.segBtn}
            onPress={() => !disabled && onChange(state)}
            activeOpacity={disabled ? 1 : 0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${SEGMENT_LABELS[i]}, ${isSelected ? 'selected' : 'not selected'}`}
          >
            {/* Status dot */}
            {state === 'available' ? (
              <Animated.View
                style={[
                  s.segDot,
                  { backgroundColor: isSelected ? Colors.green : Colors.textTertiary },
                  isSelected && {
                    shadowColor: Colors.green,
                    shadowOpacity: pulseAnim,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  s.segDot,
                  {
                    backgroundColor: state === 'booked' && isSelected
                      ? Colors.amber
                      : Colors.textTertiary,
                  },
                ]}
              />
            )}
            <Text
              style={[
                s.segLabel,
                isSelected && { color: INK },
                !isSelected && { color: Colors.textTertiary },
              ]}
            >
              {SEGMENT_LABELS[i]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Dual-Thumb Rate Slider ─────────────────────────────────────

function RateSlider({
  valueMin, valueMax, onChangeMin, onChangeMax,
}: {
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void; onChangeMax: (v: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const startValRef = useRef(0);
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);

  const valToX = (v: number) => ((v - RATE_MIN) / (RATE_MAX - RATE_MIN)) * trackWidth;
  const xToVal = (x: number) => snap(RATE_MIN + (x / trackWidth) * (RATE_MAX - RATE_MIN), RATE_STEP, RATE_MIN, RATE_MAX);

  const valMinRef = useRef(valueMin);
  valMinRef.current = valueMin;
  const valMaxRef = useRef(valueMax);
  valMaxRef.current = valueMax;
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;
  const activeRef = useRef<'min' | 'max' | null>(null);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const touchX = e.nativeEvent.pageX - trackLeftRef.current;
      const tw = trackWidthRef.current;
      if (!tw) return;
      const minX = ((valMinRef.current - RATE_MIN) / (RATE_MAX - RATE_MIN)) * tw;
      const maxX = ((valMaxRef.current - RATE_MIN) / (RATE_MAX - RATE_MIN)) * tw;
      const thumb = Math.abs(touchX - minX) <= Math.abs(touchX - maxX) ? 'min' : 'max';
      activeRef.current = thumb;
      setActiveThumb(thumb);
      // Jump to touch position immediately
      let val = snap(RATE_MIN + (touchX / tw) * (RATE_MAX - RATE_MIN), RATE_STEP, RATE_MIN, RATE_MAX);
      if (thumb === 'min') {
        val = Math.min(val, valMaxRef.current - RATE_STEP);
        val = Math.max(RATE_MIN, val);
        if (val !== valMinRef.current) onChangeMin(val);
      } else {
        val = Math.max(val, valMinRef.current + RATE_STEP);
        val = Math.min(RATE_MAX, val);
        if (val !== valMaxRef.current) onChangeMax(val);
      }
      startValRef.current = val;
    },
    onPanResponderMove: (_, gesture) => {
      const tw = trackWidthRef.current;
      if (!tw || !activeRef.current) return;
      const startX = ((startValRef.current - RATE_MIN) / (RATE_MAX - RATE_MIN)) * tw;
      const newX = startX + gesture.dx;
      let val = snap(RATE_MIN + (newX / tw) * (RATE_MAX - RATE_MIN), RATE_STEP, RATE_MIN, RATE_MAX);
      if (activeRef.current === 'min') {
        val = Math.min(val, valMaxRef.current - RATE_STEP);
        val = Math.max(RATE_MIN, val);
        if (val !== valMinRef.current) onChangeMin(val);
      } else {
        val = Math.max(val, valMinRef.current + RATE_STEP);
        val = Math.min(RATE_MAX, val);
        if (val !== valMaxRef.current) onChangeMax(val);
      }
    },
    onPanResponderRelease: () => {
      activeRef.current = null;
      setActiveThumb(null);
    },
  }), [onChangeMin, onChangeMax]);

  const minX = valToX(valueMin);
  const maxX = valToX(valueMax);

  return (
    <View style={s.sliderContainer}>
      <Text style={s.sliderValue}>
        ${valueMin}{'\u2013'}${valueMax}
        <Text style={s.sliderUnit}> / HR</Text>
      </Text>
      <View
        ref={trackRef}
        style={s.sliderTrack}
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width);
          trackRef.current?.measureInWindow((x) => { trackLeftRef.current = x; });
        }}
        {...pan.panHandlers}
      >
        {/* Track background */}
        <View style={s.sliderTrackBg} />
        {/* Track fill */}
        {trackWidth > 0 && (
          <View style={[s.sliderFill, { left: minX, width: maxX - minX }]} />
        )}
        {/* Min thumb */}
        {trackWidth > 0 && (
          <View
            style={[
              s.sliderThumb,
              { left: minX - THUMB_SIZE / 2 },
              activeThumb === 'min' && s.sliderThumbActive,
            ]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Minimum rate, ${valueMin} dollars`}
          />
        )}
        {/* Max thumb */}
        {trackWidth > 0 && (
          <View
            style={[
              s.sliderThumb,
              { left: maxX - THUMB_SIZE / 2 },
              activeThumb === 'max' && s.sliderThumbActive,
            ]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Maximum rate, ${valueMax} dollars`}
          />
        )}
      </View>
      <View style={s.sliderLabels}>
        <Text style={s.sliderLabelText}>${RATE_MIN}</Text>
        <Text style={s.sliderLabelText}>${RATE_MAX}</Text>
      </View>
    </View>
  );
}

// ── Single Radius Slider ───────────────────────────────────────

function RadiusSlider({
  value, onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const valRef = useRef(value);
  valRef.current = value;
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;
  const startValRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const touchX = e.nativeEvent.pageX - trackLeftRef.current;
      const tw = trackWidthRef.current;
      if (tw) {
        const val = snap(RADIUS_MIN + (touchX / tw) * (RADIUS_MAX - RADIUS_MIN), RADIUS_STEP, RADIUS_MIN, RADIUS_MAX);
        if (val !== valRef.current) onChange(val);
        startValRef.current = val;
      } else {
        startValRef.current = valRef.current;
      }
      setDragging(true);
    },
    onPanResponderMove: (_, gesture) => {
      const tw = trackWidthRef.current;
      if (!tw) return;
      const startX = ((startValRef.current - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * tw;
      const newX = startX + gesture.dx;
      const val = snap(RADIUS_MIN + (newX / tw) * (RADIUS_MAX - RADIUS_MIN), RADIUS_STEP, RADIUS_MIN, RADIUS_MAX);
      if (val !== valRef.current) onChange(val);
    },
    onPanResponderRelease: () => setDragging(false),
  }), [onChange]);

  const thumbX = trackWidth > 0 ? ((value - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * trackWidth : 0;

  return (
    <View style={s.sliderContainer}>
      <Text style={s.sliderValue}>
        {value}
        <Text style={s.sliderUnit}> MI</Text>
      </Text>
      <View
        ref={trackRef}
        style={s.sliderTrack}
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width);
          trackRef.current?.measureInWindow((x) => { trackLeftRef.current = x; });
        }}
        {...pan.panHandlers}
      >
        {/* Track background */}
        <View style={s.sliderTrackBg} />
        {trackWidth > 0 && (
          <View style={[s.sliderFill, { left: 0, width: thumbX }]} />
        )}
        {trackWidth > 0 && (
          <View
            style={[s.sliderThumb, { left: thumbX - THUMB_SIZE / 2 }, dragging && s.sliderThumbActive]}
            accessibilityRole="adjustable"
            accessibilityLabel={`Travel radius, ${value} miles`}
          />
        )}
      </View>
      <View style={s.sliderLabels}>
        <Text style={s.sliderLabelText}>{RADIUS_MIN} mi</Text>
        <Text style={s.sliderLabelText}>{RADIUS_MAX} mi</Text>
      </View>
    </View>
  );
}

// ── Publish Toast ──────────────────────────────────────────────

function PublishToast({
  visible, onUndo, onDismiss, skillCount,
}: {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  skillCount: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(onDismiss);
      }, UNDO_WINDOW_MS);
    } else {
      opacity.setValue(0);
      translateY.setValue(40);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, opacity, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={s.toastContent}>
        <Text style={s.toastTitle}>{strings['myCard.toast.live']}</Text>
        <Text style={s.toastSub}>
          {strings['myCard.toast.liveSub'].replace('{n}', String(skillCount))}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          onUndo();
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Undo publish"
      >
        <Text style={s.toastUndo}>{strings['myCard.toast.undo']}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Skill Picker Sheet ─────────────────────────────────────────

function SkillPickerSheet({
  visible, onClose,
  todaySkills, onToggleSkill,
  roster, categories, allTasks,
}: {
  visible: boolean;
  onClose: () => void;
  todaySkills: string[];
  onToggleSkill: (name: string) => void;
  roster: RosterSkill[];
  categories: TaskCategory[];
  allTasks: TaskItem[];
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(0);
      setExpandedCat(null);
    }
  }, [visible, slideAnim]);

  const rosterNames = useMemo(() => new Set(roster.map(r => r.name)), [roster]);
  const todaySet = useMemo(() => new Set(todaySkills), [todaySkills]);

  const groupToday = todaySkills;
  const groupRoster = roster.filter(r => !todaySet.has(r.name)).map(r => r.name);
  const atCap = todaySkills.length >= SKILL_CAP;

  const tasksByCategory = useMemo(() => {
    const map = new Map<number, TaskItem[]>();
    for (const t of allTasks) {
      if (!map.has(t.category_id)) map.set(t.category_id, []);
      map.get(t.category_id)!.push(t);
    }
    return map;
  }, [allTasks]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={s.pickerScrim} onPress={onClose}>
        <Animated.View
          style={[
            s.pickerSheet,
            { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] },
          ]}
        >
          <Pressable>{/* Block scrim tap propagation */}
            {/* Handle */}
            <View style={s.pickerHandle} />

            {/* Header */}
            <Text style={s.pickerTitle}>{strings['myCard.picker.title']}</Text>
            <Text style={s.pickerSubhead}>{strings['myCard.picker.subhead']}</Text>

            <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
              {/* Group 1: ON YOUR CARD TODAY */}
              {groupToday.length > 0 && (
                <View style={s.pickerGroup}>
                  <Text style={s.pickerGroupLabel}>
                    {strings['myCard.picker.groupToday'].replace('{n}', String(groupToday.length))}
                  </Text>
                  {groupToday.map(name => (
                    <TouchableOpacity
                      key={name}
                      style={s.pickerRowSelected}
                      onPress={() => onToggleSkill(name)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.pickerRowTextSelected}>{name}</Text>
                      <Text style={s.pickerCheck}>{'\u2713'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Group 2: VERIFIED · NOT TODAY */}
              {groupRoster.length > 0 && (
                <View style={s.pickerGroup}>
                  <Text style={s.pickerGroupLabel}>{strings['myCard.picker.groupRoster']}</Text>
                  {groupRoster.map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[s.pickerRow, atCap && s.pickerRowDimmed]}
                      onPress={() => !atCap && onToggleSkill(name)}
                      activeOpacity={atCap ? 1 : 0.7}
                    >
                      <Text style={[s.pickerRowText, atCap && s.pickerRowTextDimmed]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                  {atCap && <Text style={s.pickerCapText}>{strings['myCard.skills.cap']}</Text>}
                </View>
              )}

              {/* Group 3: ADD NEW · FROM 20 CATEGORIES */}
              <View style={s.pickerGroup}>
                <Text style={s.pickerGroupLabel}>{strings['myCard.picker.groupNew']}</Text>
                {categories.map(cat => {
                  const catTasks = tasksByCategory.get(cat.id) ?? [];
                  const isExpanded = expandedCat === cat.id;
                  return (
                    <View key={cat.id}>
                      <TouchableOpacity
                        style={s.pickerCatRow}
                        onPress={() => setExpandedCat(isExpanded ? null : cat.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.pickerCatEmoji}>{iconForSlug(cat.icon_slug)}</Text>
                        <Text style={s.pickerCatName}>{cat.name}</Text>
                        <Text style={s.pickerCatChevron}>{isExpanded ? '\u25B4' : '\u25BE'}</Text>
                      </TouchableOpacity>
                      {isExpanded && catTasks.map(task => {
                        const isOnToday = todaySet.has(task.name);
                        const isRoster = rosterNames.has(task.name);
                        const canAdd = !isOnToday && !atCap;
                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={[
                              s.pickerTaskRow,
                              isOnToday && s.pickerRowSelected,
                              !canAdd && !isOnToday && s.pickerRowDimmed,
                            ]}
                            onPress={() => {
                              if (isOnToday) onToggleSkill(task.name);
                              else if (canAdd) onToggleSkill(task.name);
                            }}
                            activeOpacity={canAdd || isOnToday ? 0.7 : 1}
                          >
                            <View style={s.pickerTaskInfo}>
                              <Text style={[
                                s.pickerRowText,
                                isOnToday && s.pickerRowTextSelected,
                                !canAdd && !isOnToday && s.pickerRowTextDimmed,
                              ]}>
                                {task.name}
                              </Text>
                              {!isRoster && (
                                <Text style={s.pickerUnverified}>
                                  {strings['myCard.picker.unverified']}
                                </Text>
                              )}
                            </View>
                            {isOnToday && <Text style={s.pickerCheck}>{'\u2713'}</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Done button */}
            <TouchableOpacity style={s.pickerDone} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.pickerDoneText}>
                {strings['myCard.picker.done'].replace('{n}', String(todaySkills.length))}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────

export default function MyCardScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold_Italic,
    SpaceGrotesk_500Medium,
    Oswald_600SemiBold, Oswald_700Bold,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium,
  });

  // ── Data state ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [roster, setRoster] = useState<RosterSkill[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);

  // ── Staged state (local, committed on PUBLISH) ───────────────
  const [stagedStatus, setStagedStatus] = useState<WorkerStatus>('offline');
  const [todaySkills, setTodaySkills] = useState<string[]>([]);
  const [rateMin, setRateMin] = useState(25);
  const [rateMax, setRateMax] = useState(35);
  const [radiusMi, setRadiusMi] = useState(7);

  // ── Committed state (what's in the DB) ───────────────────────
  const [committedStatus, setCommittedStatus] = useState<WorkerStatus>('offline');

  // ── UI state ─────────────────────────────────────────────────
  const [publishing, setPublishing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [publishedAt, setPublishedAt] = useState<Date | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const undoRef = useRef<UndoSnapshot | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bio edit state (lifetime register — independent of publish bar)
  const [showBioSheet, setShowBioSheet] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [showBioToast, setShowBioToast] = useState(false);
  const previousBioRef = useRef<string | null>(null);
  const bioUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Roster management state (lifetime register)
  const [showRosterSheet, setShowRosterSheet] = useState(false);
  const [rosterEditMode, setRosterEditMode] = useState(false);
  const [rosterView, setRosterView] = useState<'roster' | 'addCategory' | 'addTask' | 'addConfirm'>('roster');
  const [addSelectedCatId, setAddSelectedCatId] = useState<number | null>(null);
  const [addSelectedTask, setAddSelectedTask] = useState<TaskItem | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<RosterSkill | null>(null);
  const [rosterToastConfig, setRosterToastConfig] = useState<{ title: string; sub: string } | null>(null);
  const rosterUndoRef = useRef<{ action: 'add' | 'remove'; skill: RosterSkill } | null>(null);
  const rosterUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data fetch ───────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, rosterRes, catRes, tasksRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('worker_skills')
        .select('task_id, is_featured, task_library(id, name, category_id)')
        .eq('user_id', user.id),
      supabase
        .from('task_categories')
        .select('id, name, icon_slug, sort_order')
        .order('sort_order'),
      supabase
        .from('task_library')
        .select('id, name, category_id')
        .eq('is_active', true)
        .order('name'),
    ]);

    const p = profileRes.data;
    if (p) {
      setProfile(p);
      const status = (p.worker_status as WorkerStatus) ?? 'offline';
      setStagedStatus(status);
      setCommittedStatus(status);
      setTodaySkills(p.today_skills ?? []);
      setRateMin(p.today_rate_min ?? 25);
      setRateMax(p.today_rate_max ?? 35);
      setRadiusMi(p.today_radius_mi ?? 7);
    }

    const skills: RosterSkill[] = (rosterRes.data ?? []).map((r: any) => {
      const tl = r.task_library as { id: number; name: string; category_id: number } | null;
      return { name: tl?.name ?? '', taskId: tl?.id ?? 0, categoryId: tl?.category_id ?? 0, isFeatured: !!r.is_featured };
    }).filter((sk: RosterSkill) => sk.name);
    setRoster(skills);

    setCategories(catRes.data ?? []);
    setAllTasks(tasksRes.data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { console.log('[DEBUG useFocusEffect] fired — calling fetchData'); fetchData(); }, [fetchData]));

  // ── Derived state ────────────────────────────────────────────

  const hasSuperpowers = roster.length > 0;
  const rosterNames = useMemo(() => roster.map(r => r.name), [roster]);
  const firstName = profile?.first_name ?? profile?.full_name?.split(' ')[0] ?? null;
  const isNewWorker = roster.length === 0;

  // Build preview Worker object from staged state
  const previewWorker: Worker | null = profile ? {
    id: profile.id,
    full_name: profile.full_name ?? 'Anonymous',
    avatar_url: profile.avatar_url,
    bio: showBioSheet ? (bioInput || null) : (profile.bio ?? null),
    rating: null,
    superpowers: todaySkills.length > 0
      ? todaySkills.slice(0, 3)
      : rosterNames.slice(0, 3),
    worker_status: stagedStatus,
    today_rate_min: rateMin,
    today_rate_max: rateMax,
    today_radius_mi: radiusMi,
    today_skills: todaySkills,
    jobs_completed: profile.jobs_completed ?? 0,
    endorsement_count: profile.endorsement_count ?? 0,
    neighborhood: profile.city,
    created_at: profile.created_at,
  } : null;

  // ── Status line ──────────────────────────────────────────────

  function getStatusLine(): string {
    if (publishing) return strings['myCard.line.publishing'];
    if (justPublished) return strings['myCard.line.justPublished'];

    if (stagedStatus === 'available') {
      if (committedStatus !== 'available') return strings['myCard.line.armed'];
      const skillCount = todaySkills.length || rosterNames.length;
      return strings['myCard.line.live'].replace('{n}', String(skillCount));
    }
    if (stagedStatus === 'booked') return strings['myCard.line.booked'];
    // offline
    return strings['myCard.line.offline'].replace('{time}', timeAgo(profile?.updated_at));
  }

  // ── Publish config ───────────────────────────────────────────

  function getPublishConfig(): { label: string; color: 'green' | 'amber' | 'outlined' | 'disabled' } {
    if (!hasSuperpowers) return { label: strings['myCard.cta.publish'], color: 'disabled' };
    if (publishing) return { label: strings['myCard.cta.publishing'], color: 'disabled' };
    if (stagedStatus === 'booked') return { label: strings['myCard.cta.updateBooked'], color: 'amber' };
    if (stagedStatus === 'offline') return { label: strings['myCard.cta.goLive'], color: 'green' };
    // available
    if (committedStatus !== 'available') return { label: strings['myCard.cta.goLive'], color: 'green' };
    if (todaySkills.length === 0) return { label: strings['myCard.cta.goLiveAllOffers'], color: 'green' };
    return { label: strings['myCard.cta.published'], color: 'outlined' };
  }

  function getPublishHint(): string {
    if (!hasSuperpowers) return strings['myCard.hint.disabled'];
    if (stagedStatus === 'booked') return strings['myCard.hint.booked'];
    if (stagedStatus === 'available') {
      if (committedStatus !== 'available') return strings['myCard.hint.armed'];
      if (todaySkills.length === 0) return strings['myCard.hint.allOffers'];
      return strings['myCard.hint.live'].replace('{time}', publishedAt ? clockTime(publishedAt) : 'recently');
    }
    // offline
    return strings['myCard.hint.armed'];
  }

  // ── Publish handler ──────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    if (!profile || publishing) return;

    // Save undo snapshot
    undoRef.current = {
      status: committedStatus,
      todaySkills: profile.today_skills ?? [],
      rateMin: profile.today_rate_min ?? 25,
      rateMax: profile.today_rate_max ?? 35,
      radiusMi: profile.today_radius_mi ?? 7,
    };

    setPublishing(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        worker_status: stagedStatus,
        today_skills: todaySkills,
        today_rate_min: rateMin,
        today_rate_max: rateMax,
        today_radius_mi: radiusMi,
      })
      .eq('id', profile.id);

    setPublishing(false);

    if (error) {
      undoRef.current = null;
      return;
    }

    // Update committed state
    setCommittedStatus(stagedStatus);
    setProfile((p: any) => ({
      ...p,
      worker_status: stagedStatus,
      today_skills: todaySkills,
      today_rate_min: rateMin,
      today_rate_max: rateMax,
      today_radius_mi: radiusMi,
    }));
    setPublishedAt(new Date());
    setJustPublished(true);
    setShowToast(true);

    if (stagedStatus === 'available') {
      AccessibilityInfo.announceForAccessibility('You are now live on the market.');
    }

    // Clear justPublished after 5s
    setTimeout(() => setJustPublished(false), UNDO_WINDOW_MS);
  }, [profile, publishing, stagedStatus, todaySkills, rateMin, rateMax, radiusMi, committedStatus]);

  // ── Undo handler ─────────────────────────────────────────────

  const handleUndo = useCallback(async () => {
    const snap = undoRef.current;
    if (!snap || !profile) return;

    setShowToast(false);
    setJustPublished(false);

    // Restore staged state
    setStagedStatus(snap.status);
    setTodaySkills(snap.todaySkills);
    setRateMin(snap.rateMin);
    setRateMax(snap.rateMax);
    setRadiusMi(snap.radiusMi);
    setCommittedStatus(snap.status);

    // Write back to DB
    await supabase
      .from('profiles')
      .update({
        worker_status: snap.status,
        today_skills: snap.todaySkills,
        today_rate_min: snap.rateMin,
        today_rate_max: snap.rateMax,
        today_radius_mi: snap.radiusMi,
      })
      .eq('id', profile.id);

    setProfile((p: any) => ({
      ...p,
      worker_status: snap.status,
      today_skills: snap.todaySkills,
      today_rate_min: snap.rateMin,
      today_rate_max: snap.rateMax,
      today_radius_mi: snap.radiusMi,
    }));

    undoRef.current = null;
  }, [profile]);

  // ── Skill toggle ─────────────────────────────────────────────

  const toggleSkill = useCallback((name: string) => {
    setTodaySkills(prev => {
      if (prev.includes(name)) return prev.filter(s => s !== name);
      if (prev.length >= SKILL_CAP) return prev;
      return [...prev, name];
    });
  }, []);

  // ── Compliance menu ──────────────────────────────────────────

  const showComplianceMenu = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Privacy Policy', 'Terms of Service', 'Cancel'],
        cancelButtonIndex: 2,
        userInterfaceStyle: 'dark',
      },
      (index) => {
        // Links pending legal copy deployment
      },
    );
  }, []);

  // ── Bio handlers (lifetime register) ──────────────────────────

  const openBioSheet = useCallback(() => {
    setBioInput(profile?.bio ?? '');
    setShowBioSheet(true);
  }, [profile]);

  const handleBioSave = useCallback(async () => {
    if (!profile) return;
    const newBio = bioInput.trim() || null;
    previousBioRef.current = profile.bio ?? null;

    // Optimistic update
    setProfile((p: any) => ({ ...p, bio: newBio }));
    setShowBioSheet(false);

    await supabase
      .from('profiles')
      .update({ bio: newBio })
      .eq('id', profile.id);

    setShowBioToast(true);
    bioUndoTimerRef.current = setTimeout(() => {
      setShowBioToast(false);
      previousBioRef.current = null;
    }, UNDO_WINDOW_MS);
  }, [profile, bioInput]);

  const handleBioUndo = useCallback(async () => {
    if (!profile) return;
    const prev = previousBioRef.current;
    if (bioUndoTimerRef.current) clearTimeout(bioUndoTimerRef.current);
    setShowBioToast(false);

    setProfile((p: any) => ({ ...p, bio: prev }));
    await supabase
      .from('profiles')
      .update({ bio: prev })
      .eq('id', profile.id);
    previousBioRef.current = null;
  }, [profile]);

  const handleBioCancel = useCallback(() => {
    setShowBioSheet(false);
    setBioInput('');
  }, []);

  // ── Roster handlers (lifetime register) ──────────────────────

  const openRosterSheet = useCallback(() => {
    setRosterView('roster');
    setRosterEditMode(false);
    setShowRosterSheet(true);
  }, []);

  const closeRosterSheet = useCallback(() => {
    console.log('[DEBUG closeRosterSheet] ENTRY');
    setShowRosterSheet(false);
    setRosterEditMode(false);
    setRosterView('roster');
    setAddSelectedCatId(null);
    setAddSelectedTask(null);
    console.log('[DEBUG closeRosterSheet] EXIT — all state set, no fetchData');
  }, []);

  const handleAddSkill = useCallback(async () => {
    if (!addSelectedTask || !profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSkill: RosterSkill = {
      name: addSelectedTask.name,
      taskId: addSelectedTask.id,
      categoryId: addSelectedTask.category_id,
      isFeatured: false,
    };

    // ONE INSERT — data safety contract
    const { error } = await supabase
      .from('worker_skills')
      .insert({ user_id: user.id, task_id: addSelectedTask.id, is_featured: false });

    if (error) {
      if (error.code === '23505') {
        // Already in roster — duplicate key
      }
      setRosterView('roster');
      setAddSelectedTask(null);
      return;
    }

    // Optimistic local update
    setRoster(prev => [...prev, newSkill]);
    setRosterView('roster');
    setAddSelectedTask(null);

    // Toast with undo
    rosterUndoRef.current = { action: 'add', skill: newSkill };
    setRosterToastConfig({
      title: strings['myCard.add.toast'],
      sub: strings['myCard.add.toastSub'].replace('{skill}', newSkill.name),
    });
    if (rosterUndoTimerRef.current) clearTimeout(rosterUndoTimerRef.current);
    rosterUndoTimerRef.current = setTimeout(() => {
      setRosterToastConfig(null);
      rosterUndoRef.current = null;
    }, UNDO_WINDOW_MS);
  }, [addSelectedTask, profile]);

  // Belt-and-suspenders: capture removeTarget in a ref when the
  // destructive dialog opens, so stale closure can't lose it.
  const removeTargetRef = useRef<RosterSkill | null>(null);

  const handleRemoveSkill = useCallback(async () => {
    const target = removeTargetRef.current;
    console.log('[DEBUG handleRemoveSkill] ENTRY, ref:', JSON.stringify(target), 'profile:', !!profile);
    if (!target || !profile) {
      console.log('[DEBUG handleRemoveSkill] BAILED: target or profile null');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[DEBUG handleRemoveSkill] BAILED: no user');
      return;
    }

    console.log('[DEBUG handleRemoveSkill] about to delete:', user.id, target.taskId);

    // ONE DELETE — data safety contract
    const { error, data, count } = await supabase
      .from('worker_skills')
      .delete()
      .eq('user_id', user.id)
      .eq('task_id', target.taskId);

    console.log('[DEBUG handleRemoveSkill] delete result:', JSON.stringify({ error, data, count }));

    if (error) {
      console.error('[roster] delete failed:', error.message);
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
      removeTargetRef.current = null;
      return; // Chip stays visible — honest UI
    }

    console.log('[DEBUG handleRemoveSkill] applying optimistic update');
    // Optimistic local update (only on confirmed DB success)
    setRoster(prev => prev.filter(r => r.taskId !== target.taskId));
    setShowRemoveConfirm(false);
    setRemoveTarget(null);
    removeTargetRef.current = null;

    // Toast with undo
    rosterUndoRef.current = { action: 'remove', skill: target };
    setRosterToastConfig({
      title: strings['myCard.offers.remove.toast'],
      sub: target.name,
    });
    if (rosterUndoTimerRef.current) clearTimeout(rosterUndoTimerRef.current);
    rosterUndoTimerRef.current = setTimeout(() => {
      setRosterToastConfig(null);
      rosterUndoRef.current = null;
    }, UNDO_WINDOW_MS);
  }, [profile]);

  const handleRosterUndo = useCallback(async () => {
    const snap = rosterUndoRef.current;
    if (!snap || !profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (rosterUndoTimerRef.current) clearTimeout(rosterUndoTimerRef.current);
    setRosterToastConfig(null);

    if (snap.action === 'add') {
      // Undo add = ONE DELETE
      await supabase.from('worker_skills').delete()
        .eq('user_id', user.id).eq('task_id', snap.skill.taskId);
      setRoster(prev => prev.filter(r => r.taskId !== snap.skill.taskId));
    } else {
      // Undo remove = ONE INSERT (restore the row)
      await supabase.from('worker_skills').insert({
        user_id: user.id, task_id: snap.skill.taskId, is_featured: false,
      });
      setRoster(prev => [...prev, snap.skill]);
    }
    rosterUndoRef.current = null;
  }, [profile]);

  // ── Render ───────────────────────────────────────────────────

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // DEBUG: detect render loops
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log('[DEBUG render]', renderCountRef.current, 'showRosterSheet:', showRosterSheet, 'showRemoveConfirm:', showRemoveConfirm);

  const publishConfig = getPublishConfig();

  // Empty state: zero superpowers
  if (!hasSuperpowers) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.emptyCenter}>
          <View style={s.emptyRing}>
            <Text style={s.emptyRingIcon}>{'\uD83C\uDCCF'}</Text>
          </View>
          <Text style={s.emptyTitle}>{strings['myCard.empty.noSkills.title']}</Text>
          <Text style={s.emptyBody}>{strings['myCard.empty.noSkills.body']}</Text>
          <TouchableOpacity
            style={s.emptyCta}
            onPress={() => router.push('/(onboarding)/id' as any)}
            activeOpacity={0.8}
          >
            <Text style={s.emptyCtaText}>{strings['myCard.empty.noSkills.cta']}</Text>
          </TouchableOpacity>
          <Text style={s.emptyLocked}>{strings['myCard.empty.noSkills.locked']}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Self-masthead ── */}
        <Text style={s.editionLine}>{editionDate()} {'\u00b7'} YOUR CREDENTIAL</Text>
        <Text style={s.greeting}>{getGreeting(firstName, isNewWorker)}</Text>

        {/* ── Status block ── */}
        <Text style={s.eyebrow}>{strings['myCard.section.status']}</Text>
        <StatusSegment
          value={stagedStatus}
          onChange={setStagedStatus}
          disabled={!hasSuperpowers}
        />
        <Text style={s.statusLine}>{getStatusLine()}</Text>

        {/* ── Live preview ── */}
        <Text style={s.previewLabel}>LIVE PREVIEW {'\u00b7'} TAP TO EDIT</Text>
        {previewWorker && (
          <View
            style={[s.previewWrap, stagedStatus === 'offline' && { opacity: 0.5 }]}
            accessibilityLabel="Live preview of your market card"
          >
            <WorkerCardComponent
              worker={previewWorker}
              preview
              onPhotoPress={() => {
                const dest = encodeURIComponent('/(tabs)/my-card');
                router.push(`/(onboarding)/id?step=photo&returnTo=${dest}` as any);
              }}
              onBioPress={openBioSheet}
            />
          </View>
        )}
        {!profile?.avatar_url && (
          <Text style={s.photoHint}>{strings['myCard.photo.hint']}</Text>
        )}

        {/* ── MANAGE row (lifetime) ── */}
        <View style={s.manageRow}>
          <View>
            <Text style={s.eyebrow}>MY CARD {'\u00b7'} LIFETIME</Text>
            <Text style={s.manageValue}>
              {strings['myCard.offers.row']
                .replace('{verified}', String(roster.length))
                .replace('{featured}', String(roster.filter(r => r.isFeatured).length || 0))}
            </Text>
          </View>
          <TouchableOpacity
            style={s.managePill}
            onPress={openRosterSheet}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Manage offers and superpowers, ${roster.length} verified`}
          >
            <Text style={s.managePillText}>{strings['myCard.offers.manage']}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Skills editor ── */}
        <View style={s.sectionRow}>
          <Text style={s.eyebrow}>{strings['myCard.section.skills']}</Text>
          <Text style={s.skillCount}>
            {strings['myCard.skills.count'].replace('{n}', String(todaySkills.length))}
          </Text>
        </View>

        {todaySkills.length > 0 ? (
          <View style={s.chipRow}>
            {todaySkills.map(name => (
              <TouchableOpacity
                key={name}
                style={s.chip}
                onPress={() => toggleSkill(name)}
                activeOpacity={0.7}
                accessibilityLabel={`Remove ${name} from today's card`}
                accessibilityRole="button"
              >
                <Text style={s.chipText}>{name}</Text>
                <Text style={s.chipRemove}>{'\u00d7'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={s.skillsFallback}>
            {strings['myCard.skills.fallback'].replace('{n}', String(rosterNames.length))}
          </Text>
        )}

        <TouchableOpacity
          style={s.addSkillBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
          accessibilityLabel="Add skill to today's card"
          accessibilityRole="button"
        >
          <Text style={s.addSkillText}>{strings['myCard.skills.add']}</Text>
        </TouchableOpacity>

        {/* ── Rate slider ── */}
        <View style={s.knobPanel}>
          <Text style={s.eyebrow}>{strings['myCard.section.rate']}</Text>
          <RateSlider
            valueMin={rateMin}
            valueMax={rateMax}
            onChangeMin={setRateMin}
            onChangeMax={setRateMax}
          />
        </View>

        {/* ── Radius slider ── */}
        <View style={s.knobPanel}>
          <Text style={s.eyebrow}>{strings['myCard.section.radius']}</Text>
          <RadiusSlider value={radiusMi} onChange={setRadiusMi} />
        </View>

        {/* Spacer for sticky bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky publish bar ── */}
      <View style={s.publishBar}>
        <TouchableOpacity
          style={[
            s.publishBtn,
            publishConfig.color === 'green' && s.publishBtnGreen,
            publishConfig.color === 'amber' && s.publishBtnAmber,
            publishConfig.color === 'outlined' && s.publishBtnOutlined,
            publishConfig.color === 'disabled' && s.publishBtnDisabled,
          ]}
          onPress={handlePublish}
          disabled={publishConfig.color === 'disabled'}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={publishConfig.label}
          accessibilityHint="Publishes your card and sets your status."
        >
          <Text
            style={[
              s.publishBtnText,
              publishConfig.color === 'outlined' && { color: Colors.gold },
              publishConfig.color === 'disabled' && { opacity: 0.4 },
            ]}
          >
            {publishConfig.label}
          </Text>
        </TouchableOpacity>
        <Text style={s.publishHint}>{getPublishHint()}</Text>
      </View>

      {/* ── Toast ── */}
      <PublishToast
        visible={showToast}
        onUndo={handleUndo}
        onDismiss={() => setShowToast(false)}
        skillCount={todaySkills.length || rosterNames.length}
      />

      {/* ── Picker sheet ── */}
      <SkillPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        todaySkills={todaySkills}
        onToggleSkill={toggleSkill}
        roster={roster}
        categories={categories}
        allTasks={allTasks}
      />

      {/* ── Bio edit sheet ── */}
      <Modal visible={showBioSheet} transparent animationType="none">
        <Pressable style={s.pickerScrim} onPress={handleBioCancel}>
          <View style={s.bioSheet}>
            <Pressable>
              <View style={s.pickerHandle} />

              <Text style={s.bioSheetTitle}>{strings['myCard.bio.sheetTitle']}</Text>
              <Text style={s.bioSheetHint}>{strings['myCard.bio.sheetHint']}</Text>

              {/* Mini-proof */}
              <View style={s.bioProof}>
                <Text style={s.bioProofName} numberOfLines={1}>
                  {profile?.full_name ?? 'Anonymous'}
                </Text>
                <Text style={s.bioProofLine} numberOfLines={2}>
                  {bioInput || strings['myCard.bio.cardEmpty']}
                </Text>
              </View>

              {/* Text input */}
              <TextInput
                style={s.bioTextInput}
                value={bioInput}
                onChangeText={(text) => {
                  if (text.length <= 90) setBioInput(text);
                  if (text.length >= 90) {
                    AccessibilityInfo.announceForAccessibility(strings['myCard.bio.clampA11y']);
                  }
                }}
                maxLength={90}
                placeholder={strings['myCard.bio.placeholder']}
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                returnKeyType="done"
                accessibilityLabel={strings['myCard.bio.fieldA11y']}
              />

              {/* Counter + coach */}
              <View style={s.bioCounterRow}>
                <Text style={[s.bioCounter, bioInput.length >= 75 && { color: Colors.amber }]}>
                  {bioInput.length}/90
                </Text>
                <Text style={s.bioCoach}>{strings['myCard.bio.counterHint']}</Text>
              </View>

              {/* Actions */}
              <View style={s.bioActions}>
                <TouchableOpacity style={s.bioCancelBtn} onPress={handleBioCancel} activeOpacity={0.7}>
                  <Text style={s.bioCancelText}>{strings['myCard.bio.cancel']}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.bioSaveBtn} onPress={handleBioSave} activeOpacity={0.8}>
                  <Text style={s.bioSaveText}>{strings['myCard.bio.save']}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Bio toast ── */}
      {showBioToast && (
        <View style={s.toast}>
          <View style={s.toastContent}>
            <Text style={s.toastTitle}>{strings['myCard.bio.toast']}</Text>
            <Text style={s.toastSub}>{strings['myCard.bio.toastSub']}</Text>
          </View>
          <TouchableOpacity onPress={handleBioUndo} activeOpacity={0.7}>
            <Text style={s.toastUndo}>{strings['myCard.toast.undo']}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Roster & Superpowers sheet ── */}
      <Modal visible={showRosterSheet} transparent animationType="none">
        <Pressable style={s.pickerScrim} onPress={closeRosterSheet}>
          <View style={[s.pickerSheet, { maxHeight: '85%' }]}>
            <Pressable>
              <View style={s.pickerHandle} />

              {rosterView === 'roster' && (
                <>
                  <Text style={s.pickerTitle}>{strings['myCard.offers.sheetTitle']}</Text>
                  <Text style={s.pickerSubhead}>{strings['myCard.offers.sheetHint']}</Text>

                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                    {/* Featured group */}
                    <View style={s.pickerGroup}>
                      <Text style={s.pickerGroupLabel}>
                        {strings['myCard.offers.groupFeatured'].replace('{n}', String(roster.filter(r => r.isFeatured).length))}
                      </Text>
                      <View style={s.chipRow}>
                        {roster.filter(r => r.isFeatured).map(sk => (
                          <View key={sk.taskId} style={s.rosterChipFeatured}>
                            <Text style={s.rosterChipFeaturedText}>{sk.name}</Text>
                          </View>
                        ))}
                        {roster.filter(r => r.isFeatured).length === 0 && (
                          <Text style={s.skillsFallback}>No superpowers yet</Text>
                        )}
                      </View>
                    </View>

                    {/* Roster group (not featured) */}
                    <View style={s.pickerGroup}>
                      <View style={s.rosterGroupHeader}>
                        <Text style={s.pickerGroupLabel}>{strings['myCard.offers.groupRoster']}</Text>
                        <TouchableOpacity
                          onPress={() => setRosterEditMode(prev => !prev)}
                          activeOpacity={0.7}
                        >
                          <Text style={s.rosterEditToggle}>
                            {rosterEditMode ? 'DONE' : strings['myCard.offers.editMode']}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {!rosterEditMode && (
                        <Text style={s.rosterHint}>{strings['myCard.offers.rosterHint']}</Text>
                      )}
                      <View style={s.chipRow}>
                        {roster.filter(r => !r.isFeatured).map(sk => (
                          <View key={sk.taskId} style={s.rosterChipOutline}>
                            <Text style={s.rosterChipOutlineText}>{sk.name}</Text>
                            {rosterEditMode && (
                              <TouchableOpacity
                                onPress={() => {
                                  console.log('[DEBUG ×] tap fired, sk:', JSON.stringify(sk));
                                  setRemoveTarget(sk);
                                  removeTargetRef.current = sk;
                                  console.log('[DEBUG ×] ref set:', JSON.stringify(removeTargetRef.current));
                                  setShowRemoveConfirm(true);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel={`Remove ${sk.name}`}
                              >
                                <Text style={s.rosterRemoveX}>{'\u00d7'}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Add to roster */}
                    <View style={s.pickerGroup}>
                      <Text style={s.pickerGroupLabel}>{strings['myCard.offers.groupAdd']}</Text>
                      <TouchableOpacity
                        style={s.addSkillBtn}
                        onPress={() => setRosterView('addCategory')}
                        activeOpacity={0.7}
                      >
                        <Text style={s.addSkillText}>{strings['myCard.offers.addSkill']}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }} />
                  </ScrollView>

                  <TouchableOpacity style={s.pickerDone} onPress={() => { console.log('[DEBUG DONE btn] tapped'); closeRosterSheet(); }} activeOpacity={0.8}>
                    <Text style={s.pickerDoneText}>{strings['myCard.offers.done']}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Add skill — Step 1: Category */}
              {rosterView === 'addCategory' && (
                <>
                  <View style={s.addFlowHeader}>
                    <TouchableOpacity onPress={() => setRosterView('roster')}>
                      <Text style={s.addFlowBack}>{'\u2039'} Back</Text>
                    </TouchableOpacity>
                    <Text style={s.addFlowStep}>{strings['myCard.add.steps.category']}</Text>
                  </View>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={s.pickerCatRow}
                        onPress={() => { setAddSelectedCatId(cat.id); setRosterView('addTask'); }}
                        activeOpacity={0.7}
                      >
                        <Text style={s.pickerCatEmoji}>{iconForSlug(cat.icon_slug)}</Text>
                        <Text style={s.pickerCatName}>{cat.name}</Text>
                        <Text style={s.pickerCatChevron}>{'\u203a'}</Text>
                      </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                  </ScrollView>
                </>
              )}

              {/* Add skill — Step 2: Task */}
              {rosterView === 'addTask' && (
                <>
                  <View style={s.addFlowHeader}>
                    <TouchableOpacity onPress={() => setRosterView('addCategory')}>
                      <Text style={s.addFlowBack}>{'\u2039'} Back</Text>
                    </TouchableOpacity>
                    <Text style={s.addFlowStep}>{strings['myCard.add.steps.task']}</Text>
                  </View>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                    {allTasks
                      .filter(t => t.category_id === addSelectedCatId)
                      .map(task => {
                        const alreadyInRoster = roster.some(r => r.taskId === task.id);
                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={[s.pickerRow, alreadyInRoster && s.pickerRowDimmed]}
                            onPress={() => {
                              if (!alreadyInRoster) { setAddSelectedTask(task); setRosterView('addConfirm'); }
                            }}
                            activeOpacity={alreadyInRoster ? 1 : 0.7}
                          >
                            <Text style={[s.pickerRowText, alreadyInRoster && s.pickerRowTextDimmed]}>
                              {task.name}
                            </Text>
                            {alreadyInRoster && (
                              <Text style={s.pickerCheck}>{'\u2713'}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    <View style={{ height: 40 }} />
                  </ScrollView>
                </>
              )}

              {/* Add skill — Step 3: Confirm */}
              {rosterView === 'addConfirm' && addSelectedTask && (
                <View style={s.addConfirmContent}>
                  <Text style={s.addFlowStep}>{strings['myCard.add.steps.confirm']}</Text>
                  <Text style={s.addConfirmTitle}>
                    {strings['myCard.add.confirmTitle'].replace('{skill}', addSelectedTask.name)}
                  </Text>
                  <Text style={s.addConfirmBody}>{strings['myCard.add.confirmBody']}</Text>
                  <View style={s.bioActions}>
                    <TouchableOpacity
                      style={s.bioCancelBtn}
                      onPress={() => { setAddSelectedTask(null); setRosterView('addTask'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={s.bioCancelText}>{strings['myCard.bio.cancel']}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.bioSaveBtn} onPress={handleAddSkill} activeOpacity={0.8}>
                      <Text style={s.bioSaveText}>{strings['myCard.add.confirmCta']}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Remove confirm dialog ── */}
      <Modal visible={showRemoveConfirm} transparent animationType="fade">
        <View style={s.removeOverlay}>
          <View style={s.removeDialog}>
            <Text style={s.removeTitle}>
              {strings['myCard.offers.remove.title'].replace('{skill}', removeTarget?.name ?? '')}
            </Text>
            <Text style={s.removeBody}>{strings['myCard.offers.remove.body']}</Text>
            <View style={s.removeActions}>
              <TouchableOpacity
                style={s.removeKeepBtn}
                onPress={() => { setShowRemoveConfirm(false); setRemoveTarget(null); }}
                activeOpacity={0.7}
              >
                <Text style={s.removeKeepText}>{strings['myCard.offers.remove.keep']}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.removeConfirmBtn} onPress={() => { console.log('[DEBUG REMOVE btn] tapped'); handleRemoveSkill(); }} activeOpacity={0.8}>
                <Text style={s.removeConfirmText}>{strings['myCard.offers.remove.confirm']}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Roster toast ── */}
      {rosterToastConfig && (
        <View style={s.toast}>
          <View style={s.toastContent}>
            <Text style={s.toastTitle}>{rosterToastConfig.title}</Text>
            <Text style={s.toastSub}>{rosterToastConfig.sub}</Text>
          </View>
          <TouchableOpacity onPress={handleRosterUndo} activeOpacity={0.7}>
            <Text style={s.toastUndo}>{strings['myCard.toast.undo']}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  // ── Masthead ──
  editionLine: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  greeting: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // ── Eyebrow ──
  eyebrow: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.gold,
    marginBottom: Spacing.sm,
  },

  // ── Status segment ──
  segOuter: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
    height: 44,
  },
  segIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 9,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  segDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  segLabel: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 1,
  },

  // ── Status line ──
  statusLine: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  // ── Preview ──
  previewLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  previewWrap: {
    marginBottom: Spacing.sm,
  },
  photoHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },

  // ── Skills editor ──
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  skillCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.gold,
  },
  chipRemove: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.6,
  },
  skillsFallback: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  addSkillBtn: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderStyle: 'solid',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  addSkillText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.gold,
  },

  // ── Knob panels ──
  knobPanel: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  // ── Sliders ──
  sliderContainer: {
    marginTop: 4,
  },
  sliderValue: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.gold,
    marginBottom: Spacing.sm,
  },
  sliderUnit: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  sliderTrack: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    top: 18,
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    top: 18,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.gold,
    top: (40 - THUMB_SIZE) / 2,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  sliderThumbActive: {
    width: THUMB_ACTIVE_SIZE,
    height: THUMB_ACTIVE_SIZE,
    borderRadius: THUMB_ACTIVE_SIZE / 2,
    top: (40 - THUMB_ACTIVE_SIZE) / 2,
    borderWidth: 3,
    borderColor: Colors.gold,
    backgroundColor: Colors.background,
    shadowColor: Colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sliderLabelText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Colors.textTertiary,
  },

  // ── Publish bar ──
  publishBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  publishBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  publishBtnGreen: {
    backgroundColor: Colors.green,
  },
  publishBtnAmber: {
    backgroundColor: Colors.amber,
  },
  publishBtnOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  publishBtnDisabled: {
    backgroundColor: Colors.gold,
    opacity: 0.4,
  },
  publishBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1.5,
    color: INK,
  },
  publishHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // ── Toast ──
  toast: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toastTitle: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.cream,
    marginBottom: 2,
  },
  toastSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  toastUndo: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 999,
  },

  // ── Empty state ──
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyRingIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    letterSpacing: 1.5,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyCta: {
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: Spacing.sm,
  },
  emptyCtaText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: INK,
  },
  emptyLocked: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── Picker sheet ──
  pickerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '78%',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  pickerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  pickerSubhead: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickerScroll: {
    paddingHorizontal: Spacing.md,
  },
  pickerGroup: {
    marginBottom: Spacing.lg,
  },
  pickerGroupLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.gold,
    marginBottom: Spacing.sm,
  },
  pickerRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerRowSelected: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerRowDimmed: {
    opacity: 0.4,
  },
  pickerRowText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pickerRowTextSelected: {
    fontFamily: Fonts.bodyMed,
    fontSize: 14,
    color: Colors.gold,
  },
  pickerRowTextDimmed: {
    color: Colors.textTertiary,
  },
  pickerCheck: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.gold,
  },
  pickerCapText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.amber,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Category picker (Group 3)
  pickerCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 6,
  },
  pickerCatEmoji: {
    fontSize: 20,
  },
  pickerCatName: {
    flex: 1,
    fontFamily: Fonts.bodyMed,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pickerCatChevron: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  pickerTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingLeft: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginBottom: 4,
  },
  pickerTaskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerUnverified: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: 'rgba(201,168,76,0.5)',
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },

  // Done button
  pickerDone: {
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    marginHorizontal: Spacing.md,
    alignItems: 'center',
  },
  pickerDoneText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: INK,
  },

  // ── Bio edit sheet ──
  bioSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  bioSheetTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bioSheetHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  bioProof: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: Spacing.md,
  },
  bioProofName: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bioProofLine: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  bioTextInput: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.sm,
  },
  bioCounterRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  bioCounter: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'] as any,
  },
  bioCoach: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  bioActions: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  bioCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  bioCancelText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.gold,
  },
  bioSaveBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  bioSaveText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: INK,
  },

  // ── MANAGE row ──
  manageRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  manageValue: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  managePill: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  managePillText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.gold,
  },

  // ── Roster sheet chips ──
  rosterGroupHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  rosterEditToggle: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.gold,
  },
  rosterHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  rosterChipFeatured: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rosterChipFeaturedText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.gold,
  },
  rosterChipOutline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rosterChipOutlineText: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.gold,
  },
  rosterRemoveX: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.red,
  },

  // ── Add skill flow ──
  addFlowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  addFlowBack: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.gold,
  },
  addFlowStep: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.gold,
  },
  addConfirmContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  addConfirmTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  addConfirmBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },

  // ── Remove confirm dialog ──
  removeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: Spacing.xl,
  },
  removeDialog: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.md,
  },
  removeTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  removeBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  removeActions: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: Spacing.sm,
  },
  removeKeepBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  removeKeepText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.gold,
  },
  removeConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  removeConfirmText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
});
