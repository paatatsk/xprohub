// app/logo-test.tsx
// ⚠️ TEMPORARY — evaluation screen only. Not part of the product.
// Reached via a temp "Logo test" link at the bottom of Account.
// Delete this file + components/XProHubLogo.tsx + assets/logo/* +
// the _layout.tsx <Stack.Screen name="logo-test"> line + the Account link
// when the logo decision is locked.
//
// v2 assets (corrected knot↔wordmark spacing). One artwork, locked brand
// gold #C9A84C. Two component variants:
//   • lockup — knot + wordmark, wordmark dropped 12u for the wider gap
//   • mark   — knot alone, square, icon-safe
// White variant shown too (for light surfaces / the eventual print use).

import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../constants/theme';
import { XProHubLogo } from '../components/XProHubLogo';

const BRAND_GOLD = '#C9A84C'; // Colors.gold — the only logo colour now

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.eyebrow}>{title}</Text>
      {children}
    </View>
  );
}

export default function LogoTestScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.note}>
          <Text style={s.noteText}>
            Temporary evaluation screen · v2 artwork (wider knot↔wordmark gap) ·
            brand gold #C9A84C only. Checking: lockup shows the opened-up gap,
            mark renders the knot alone and stays legible small.
          </Text>
        </View>

        {/* ── A. LOCKUP AT 3 WIDTHS ─────────────────────────────── */}
        <Section title="A · LOCKUP — 280 / 160 / 90 px wide">
          {[280, 160, 90].map((w) => (
            <View key={w} style={s.stack}>
              <Label>{w} px</Label>
              <XProHubLogo variant="lockup" width={w} />
            </View>
          ))}
        </Section>

        {/* ── B. MARK ALONE AT 5 SIZES ──────────────────────────── */}
        <Section title="B · MARK — 120 / 64 / 40 / 28 / 20 px">
          <View style={s.rowWrap}>
            {[120, 64, 40, 28, 20].map((w) => (
              <View key={w} style={s.stack}>
                <Label>{w} px</Label>
                <XProHubLogo variant="mark" width={w} />
              </View>
            ))}
          </View>
        </Section>

        {/* ── C. LOCKUP vs MARK, matched height ─────────────────── */}
        <Section title="C · LOCKUP vs MARK — same 96 px height">
          <View style={s.compareRow}>
            <View style={s.compareCell}>
              {/* width chosen so height ≈ 96 at the lockup aspect (~0.906) */}
              <XProHubLogo variant="lockup" width={87} />
              <Label>lockup</Label>
            </View>
            <View style={s.compareCell}>
              <XProHubLogo variant="mark" width={96} />
              <Label>mark</Label>
            </View>
          </View>
        </Section>

        {/* ── D. WHITE VARIANT (light surfaces / print) ─────────── */}
        <Section title="D · WHITE — on a light card">
          <View style={s.lightCard}>
            <XProHubLogo variant="lockup" width={160} color="#FFFFFF" />
          </View>
          <View style={[s.lightCard, s.lightCardRow]}>
            <XProHubLogo variant="mark" width={40} color="#FFFFFF" />
            <XProHubLogo variant="mark" width={28} color="#FFFFFF" />
            <XProHubLogo variant="mark" width={20} color="#FFFFFF" />
          </View>
        </Section>

        {/* ── E. MOCK SPLASH ────────────────────────────────────── */}
        <Section title="E · MOCK SPLASH — lockup 200 px on #0E0E0F">
          <View style={s.splash}>
            <XProHubLogo variant="lockup" width={200} />
          </View>
        </Section>

        {/* ── F. MOCK HEADER vs CURRENT WORDMARK ────────────────── */}
        <Section title="F · MOCK HEADER — mark 24 px vs current wordmark">
          <View style={s.headerMock}>
            <XProHubLogo variant="mark" width={24} />
            <Label>mark @ 24 px</Label>
          </View>
          <View style={s.headerMock}>
            <Text style={s.currentWordmark}>XPROHUB</Text>
            <Label>current Home wordmark (Space Grotesk, tracked 4)</Label>
          </View>
        </Section>

        <Text style={s.footer}>— end of logo test —</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },

  note: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: 8,
    padding: Spacing.md,
  },
  noteText: {
    fontFamily: Fonts.body,
    color: Colors.amber,
    fontSize: 12,
    lineHeight: 17,
  },

  section: { gap: Spacing.md },
  eyebrow: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  stack: { gap: 6, alignItems: 'flex-start' },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: Spacing.lg,
  },

  label: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 11,
  },

  compareRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compareCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },

  lightCard: {
    backgroundColor: '#F5EEDC',
    borderRadius: 8,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  lightCardRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  splash: {
    width: '100%',
    height: 320,
    backgroundColor: '#0E0E0F',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerMock: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
  },
  currentWordmark: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: Fonts.heading,
    letterSpacing: 4,
  },

  footer: {
    fontFamily: Fonts.body,
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
