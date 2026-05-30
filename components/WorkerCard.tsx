import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Fonts, Radius } from '../constants/theme';
import { strings } from '../constants/strings';
import CornerStamp from './CornerStamp';

// ── Types ──────────────────────────────────────────────────────

export interface Worker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  rating: number | null;
  superpowers: string[];
  worker_status: 'offline' | 'available' | 'booked';
  today_rate_min: number | null;
  today_rate_max: number | null;
  today_radius_mi: number | null;
  today_skills: string[];
  jobs_completed: number;
  endorsement_count: number;
  neighborhood: string | null;
  created_at?: string;
}

interface WorkerCardProps {
  worker: Worker;
  preview?: boolean;
  onHire?: () => void;
  onPress?: () => void;
  onOverflow?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? '' : '';
  return (first + last).toUpperCase();
}

function formatWorkerId(id: string): string {
  // Take last 6 chars of UUID, zero-pad, format as XX-XXXX
  const numStr = id.replace(/-/g, '').slice(-6).toUpperCase();
  const padded = numStr.padStart(6, '0');
  return `${padded.slice(0, 2)}-${padded.slice(2)}`;
}

function formatIssuedDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const mon = months[d.getMonth()]!;
  const year = d.getFullYear();
  return `${day}\u00b7${mon}\u00b7${year}`;
}

// ── Status Dot ─────────────────────────────────────────────────

function StatusDot({ status }: { status: Worker['worker_status'] }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'available') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [status, pulseAnim]);

  const dotColor =
    status === 'available' ? Colors.green :
    status === 'booked'    ? Colors.amber :
    Colors.textTertiary;

  const shadowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View
      style={[
        s.statusDot,
        { backgroundColor: dotColor },
        status === 'available' && {
          shadowColor: Colors.green,
          shadowOpacity,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    />
  );
}

// ── Skill Pills ────────────────────────────────────────────────

type PillVariant = 'filled' | 'outlined' | 'dimmed';

function SkillPill({ label, variant }: { label: string; variant: PillVariant }) {
  const variantStyle =
    variant === 'filled'   ? s.pillFilled :
    variant === 'outlined' ? s.pillOutlined :
    s.pillDimmed;

  const textStyle =
    variant === 'dimmed' ? s.pillTextDimmed : s.pillText;

  return (
    <View style={[s.pill, variantStyle]}>
      <Text style={textStyle} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function DisclosurePill({ count }: { count: number }) {
  return (
    <View style={[s.pill, s.pillDisclosure]}>
      <Text style={s.pillText}>+ {count} MORE</Text>
    </View>
  );
}

// ── Track Record Line ──────────────────────────────────────────

function TrackRecord({ worker }: { worker: Worker }) {
  const segments: React.ReactNode[] = [];

  if (worker.endorsement_count > 0) {
    segments.push(
      <Text key="endorsed">
        <Text style={s.trackGold}>{worker.endorsement_count}</Text>
        <Text style={s.trackText}> {strings['card.track.endorsedSuffix']}</Text>
      </Text>
    );
  }

  if (worker.neighborhood) {
    segments.push(
      <Text key="hood" style={s.trackText}>{worker.neighborhood}</Text>
    );
  }

  if (worker.today_rate_min != null && worker.today_rate_max != null) {
    segments.push(
      <Text key="rate">
        <Text style={s.trackGold}>${worker.today_rate_min}{'\u2013'}{worker.today_rate_max}</Text>
        <Text style={s.trackText}>/hr</Text>
      </Text>
    );
  }

  if (segments.length === 0) return null;

  return (
    <Text style={s.trackLine} numberOfLines={1}>
      {segments.map((seg, i) => (
        <Text key={i}>
          {i > 0 && <Text style={s.trackSep}> {'\u00b7'} </Text>}
          {seg}
        </Text>
      ))}
    </Text>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function WorkerCard({ worker, preview, onHire, onPress, onOverflow }: WorkerCardProps) {
  const workerId = formatWorkerId(worker.id);
  const initials = getInitials(worker.full_name);

  // Three-state skill display
  const useToday = worker.worker_status !== 'offline' && worker.today_skills.length > 0;
  const skillSource = useToday ? worker.today_skills : worker.superpowers;
  const skillLabel =
    worker.worker_status === 'available' && useToday ? strings['card.skills.today'] :
    worker.worker_status === 'booked'    && useToday ? strings['card.skills.bookedFor'] :
    strings['card.skills.offers'];
  const pillVariant: PillVariant =
    worker.worker_status === 'available' && useToday ? 'filled' :
    worker.worker_status === 'booked'    && useToday ? 'outlined' :
    'dimmed';

  const visibleSkills = skillSource.slice(0, 3);
  const overflowCount = skillSource.length - 3;

  const showNewStamp = worker.jobs_completed < 10;

  const cardContent = (
    <View style={s.container}>

      {/* NEW stamp — outline treatment, tucked inside the card frame */}
      {showNewStamp && (
        <CornerStamp
          variant="new-outline"
          accessibilityLabel="New to XProHub"
        />
      )}

      {/* ── Gold credential stripe ── */}
      <View style={s.stripe}>
        <Text style={s.stripeLeft}>XPROHUB {'\u00b7'} WORKER PASS</Text>
        <View style={s.stripeRightRow}>
          <Text style={s.stripeRight}>No. {workerId}</Text>
          {!preview && onOverflow && (
            <TouchableOpacity
              onPress={onOverflow}
              activeOpacity={0.6}
              accessibilityLabel="More options"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.stripeOverflow}>{'\u00b7\u00b7\u00b7'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body row ── */}
      <View style={s.bodyRow}>

        {/* Portrait */}
        <View style={s.portrait}>
          {worker.avatar_url ? (
            <Image source={{ uri: worker.avatar_url }} style={s.portraitImage} />
          ) : (
            <View style={s.portraitFallback}>
              <Text style={s.portraitInitials}>{initials}</Text>
            </View>
          )}
          {/* PHOTO stamp */}
          <View style={s.photoStamp}>
            <Text style={s.photoStampText}>PHOTO</Text>
          </View>
        </View>

        {/* Info column */}
        <View style={s.infoCol}>
          {/* Name label */}
          <Text style={s.nameLabel}>NAME</Text>

          {/* Name + status dot */}
          <View style={s.nameRow}>
            <Text style={s.nameText} numberOfLines={1}>{worker.full_name}</Text>
            <StatusDot status={worker.worker_status} />
          </View>

          {/* Bio */}
          {worker.bio ? (
            <Text style={s.bio} numberOfLines={2}>{worker.bio}</Text>
          ) : null}

          {/* Track record */}
          <TrackRecord worker={worker} />

          {/* Skill block */}
          {visibleSkills.length > 0 && (
            <View style={s.skillBlock}>
              <Text style={s.skillLabel}>{skillLabel}</Text>
              <View style={s.pillRow}>
                {visibleSkills.map((sk, i) => (
                  <SkillPill key={i} label={sk} variant={pillVariant} />
                ))}
                {overflowCount > 0 && <DisclosurePill count={overflowCount} />}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Footer (hidden in preview mode) ── */}
      {!preview && (
        <View style={s.footer}>
          <Text style={s.footerMeta} numberOfLines={1}>
            <Text style={s.footerMetaGold}>ID {workerId}</Text>
            {' \u00b7 ISSUED '}
            {formatIssuedDate(worker.created_at)}
          </Text>

          {onHire && (
            <TouchableOpacity
              style={s.hireBtn}
              activeOpacity={0.8}
              onPress={onHire}
              accessibilityLabel={`Hire ${worker.full_name}`}
              accessibilityRole="button"
            >
              <Text style={s.hireBtnText}>{strings['card.action.hire']}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Whole card tappable when onPress provided and not in preview
  if (onPress && !preview) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

// ── Styles ─────────────────────────────────────────────────────

const INK = '#1A0F00';

const s = StyleSheet.create({
  // Container
  container: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'visible',
    marginBottom: 12,
  },
  // Gold credential stripe
  stripe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  stripeLeft: {
    fontFamily: Fonts.displayB,
    fontSize: 9,
    letterSpacing: 3,
    color: INK,
  },
  stripeRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stripeRight: {
    fontFamily: Fonts.monoMed,
    fontSize: 9,
    letterSpacing: 1,
    color: INK,
  },
  stripeOverflow: {
    fontFamily: Fonts.monoMed,
    fontSize: 11,
    color: 'rgba(26,15,0,0.55)',
    letterSpacing: 2,
  },

  // Body row
  bodyRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    alignItems: 'flex-start',
  },

  // Portrait
  portrait: {
    width: 72,
    height: 88,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 6,
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitFallback: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitInitials: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    color: Colors.gold,
  },
  photoStamp: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    backgroundColor: 'rgba(14,14,15,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
  },
  photoStampText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
    color: 'rgba(201,168,76,0.55)',
  },

  // Info column
  infoCol: {
    flex: 1,
  },
  nameLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nameText: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bio: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textSecondary,
    marginBottom: 9,
  },

  // Track record
  trackLine: {
    marginBottom: 9,
  },
  trackText: {
    fontFamily: Fonts.monoMed,
    fontSize: 10,
    letterSpacing: 0.3,
    color: Colors.textSecondary,
  },
  trackGold: {
    fontFamily: Fonts.monoMed,
    fontSize: 10,
    letterSpacing: 0.3,
    color: Colors.gold,
    fontWeight: '600',
  },
  trackSep: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textTertiary,
  },

  // Skill block
  skillBlock: {
    marginTop: 2,
  },
  skillLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 2.5,
    color: Colors.gold,
    marginBottom: 5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingTop: 3,
    paddingBottom: 2,
    borderRadius: Radius.full,
  },
  pillFilled: {
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  pillOutlined: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    backgroundColor: 'transparent',
  },
  pillDimmed: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    backgroundColor: 'transparent',
  },
  pillText: {
    fontFamily: Fonts.heading,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: Colors.gold,
  },
  pillTextDimmed: {
    fontFamily: Fonts.heading,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: 'rgba(201,168,76,0.7)',
  },
  pillDisclosure: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(201,168,76,0.04)',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(14,14,15,0.4)',
  },
  footerMeta: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  footerMetaGold: {
    color: Colors.gold,
    fontWeight: '600',
  },
  hireBtn: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  hireBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.gold,
  },

});
