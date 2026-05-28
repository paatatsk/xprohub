import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Radius } from '../constants/theme';
import CornerStamp from './CornerStamp';

// ── Types ──────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  neighborhood: string | null;
  timing: string | null;
  is_urgent: boolean;
  created_at: string;
  customer_id: string;
}

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

// ── Helpers ────────────────────────────────────────────────────

function budgetLabel(min: number | null, max: number | null): string {
  if (min && max) return `$${min}\u2013$${max}`;
  if (min)        return `From $${min}`;
  if (max)        return `Up to $${max}`;
  return 'Budget TBD';
}

function timingUnit(timing: string | null): string {
  if (timing === 'asap')      return '/ ONE-TIME';
  if (timing === 'scheduled') return '/ SCHEDULED';
  if (timing === 'flexible')  return '/ ONE-TIME';
  return '';
}

function timingLabel(timing: string | null): string {
  if (timing === 'asap')      return 'ASAP';
  if (timing === 'scheduled') return 'Scheduled';
  if (timing === 'flexible')  return 'Flexible';
  return '';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function isNewPost(dateStr: string): boolean {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs < 3_600_000; // less than 1 hour
}

// ── Main Component ─────────────────────────────────────────────

export default function JobCard({ job, onPress }: JobCardProps) {
  const showUrgentStamp = job.is_urgent;
  const showNewStamp = !showUrgentStamp && isNewPost(job.created_at);

  return (
    <TouchableOpacity
      style={[
        s.container,
        showUrgentStamp && s.containerUrgent,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Job: ${job.title}`}
      accessibilityRole="button"
    >
      {/* Corner stamp */}
      {showUrgentStamp && <CornerStamp variant="urgent" />}
      {showNewStamp && <CornerStamp variant="new" />}

      {/* Category divider */}
      {job.category && (
        <View style={s.categoryRow}>
          <View style={s.categoryLine} />
          <Text style={s.categoryLabel}>{job.category.toUpperCase()}</Text>
          <View style={s.categoryLine} />
        </View>
      )}

      {/* Title */}
      <Text style={s.title} numberOfLines={2}>{job.title}</Text>

      {/* Description */}
      {job.description && (
        <Text style={s.description} numberOfLines={2}>{job.description}</Text>
      )}

      {/* Budget headline */}
      <View style={s.budgetRow}>
        <Text style={s.budgetNumber}>{budgetLabel(job.budget_min, job.budget_max)}</Text>
        {job.timing && (
          <Text style={s.budgetUnit}>{timingUnit(job.timing)}</Text>
        )}
      </View>

      {/* Meta footer */}
      <View style={s.metaFooter}>
        {job.neighborhood && (
          <Text style={s.metaItem}>
            {'\ud83d\udccd'} <Text style={s.metaAccent}>{job.neighborhood}</Text>
          </Text>
        )}
        {job.neighborhood && job.timing && <Text style={s.metaSep}>{'\u00b7'}</Text>}
        {job.timing && (
          <Text style={s.metaItem}>
            {'\ud83d\udd50'} <Text style={s.metaAccent}>{timingLabel(job.timing)}</Text>
          </Text>
        )}
        {(job.neighborhood || job.timing) && <Text style={s.metaSep}>{'\u00b7'}</Text>}
        <Text style={s.metaItem}>
          posted <Text style={s.metaAccent}>{timeAgo(job.created_at)}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 18,
    paddingBottom: 16,
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
  },
  containerUrgent: {
    borderColor: Colors.red,
  },

  // Corner stamp — see components/CornerStamp.tsx

  // Category divider
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  categoryLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    letterSpacing: 3,
    color: Colors.gold,
    paddingHorizontal: 10,
  },

  // Title
  title: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 21,
    color: Colors.textPrimary,
    paddingRight: 8,
    marginBottom: 8,
  },

  // Description
  description: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  // Budget
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  budgetNumber: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: 0.5,
    color: Colors.gold,
  },
  budgetUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },

  // Meta footer
  metaFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 11,
  },
  metaItem: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaAccent: {
    color: Colors.cream,
    fontWeight: '500',
  },
  metaSep: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
