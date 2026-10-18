import { useCallback, useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  Oswald_600SemiBold,
  Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../../constants/theme';

// ─── Colours (all from design system) ─────────────────────────
const GOLD  = Colors.gold;        // #F0D48A
const BG    = Colors.background;  // #4A4A4D
const PAPER = Colors.textPrimary;  // was '#F5EEDC' (light text on dark)
const CREAM = Colors.textSecondary; // was '#E8DCC0' (light text on dark)
const INK   = '#1A0F00';
const AUTO_SWAP_MS = 3000; // yin-yang auto-swap interval

// ─── Ornate gold divider (line ◆ line) ────────────────────────
function OrnateDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerDiamond}>◆</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Yin-yang SVG — gold left / dark right + gold outline ─────
// Change 3: added stroke on outer Circle
function YinYang() {
  return (
    <Svg width={42} height={42} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={48} fill={GOLD} stroke={GOLD} strokeWidth={1.5} />
      <Path
        d="M50,0 A50,50,0,0,1,50,100 A25,25,0,0,1,50,50 A25,25,0,0,0,50,0Z"
        fill={INK}
      />
      <Circle cx={50} cy={25} r={10} fill={INK} />
      <Circle cx={50} cy={75} r={10} fill={GOLD} />
      {/* Outer gold ring */}
      <Circle cx={50} cy={50} r={49} fill="none" stroke={GOLD} strokeWidth={1.5} />
    </Svg>
  );
}

// ─── Dollar sign SVG (42×42, dark circle, gold $ inside) ──────
// Change 6: matches yin-yang size and dark/gold contrast
function DollarSign() {
  return (
    <Svg width={42} height={42} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={47} fill={BG} stroke={GOLD} strokeWidth={3} />
      {/* Vertical bar through $ */}
      <Path
        d="M50 14 L50 86"
        stroke={GOLD} strokeWidth={5} strokeLinecap="round"
      />
      {/* S-curve of $ */}
      <Path
        d="M65 30 Q65 20 50 20 Q35 20 35 34 Q35 48 50 50 Q65 52 65 66 Q65 80 50 80 Q35 80 35 70"
        stroke={GOLD} strokeWidth={5} fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Trust-strip SVG icons (stroked gold, 24×24) ──────────────
// Change 1: icons bumped from 16 to 24
function LockIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20">
      <Path
        d="M5 9V6a5 5 0 0 1 10 0v3"
        stroke={GOLD} strokeWidth={1.6} fill="none" strokeLinecap="round"
      />
      <Path
        d="M3 9h14v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
        stroke={GOLD} strokeWidth={1.6} fill="none"
      />
      <Circle cx={10} cy={14} r={1.5} fill={GOLD} />
    </Svg>
  );
}

function ThumbsUpIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20">
      <Path
        d="M7 17V9m0 0l2.5-5a1.5 1.5 0 0 1 2.8.7L11.5 9H16a2 2 0 0 1 1.9 2.6l-1.5 5A2 2 0 0 1 14.5 18H9a2 2 0 0 1-2-2zm0-6H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2"
        stroke={GOLD} strokeWidth={1.6} fill="none"
        strokeLinejoin="round" strokeLinecap="round"
      />
    </Svg>
  );
}

function BoltIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20">
      <Path
        d="M11 2L4 12h7l-2 6 9-10h-7l2-6z"
        stroke={GOLD} strokeWidth={1.6} fill="none"
        strokeLinejoin="round" strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();

  // ── Fonts ──────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Oswald_600SemiBold,
    Oswald_700Bold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
  });
  const oswald700  = fontsLoaded ? 'Oswald_700Bold'                 : 'System';
  const playfair   = fontsLoaded ? 'PlayfairDisplay_700Bold'        : 'serif';
  const playfairIt = fontsLoaded ? 'PlayfairDisplay_700Bold_Italic' : 'serif';

  // ── Change 4: single pulse animation on mount ──────────────
  const pulseScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.20,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(pulseScale, {
        toValue: 1.0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Change 5: top-box color swap on yin-yang tap ───────────
  const [topBoxesSwapped, setTopBoxesSwapped] = useState(false);
  const swapAnim = useRef(new Animated.Value(0)).current;
  // Ref mirrors the state so the auto-swap interval never reads a stale value.
  const swappedRef = useRef(false);

  const swap = useCallback(() => {
    const next = !swappedRef.current;
    swappedRef.current = next;
    setTopBoxesSwapped(next);
    Animated.timing(swapAnim, {
      toValue: next ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // colour interpolation requires JS driver
    }).start();
  }, [swapAnim]);

  // ── Auto-swap every 3s while focused; skipped when Reduce Motion is on ──
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Bumped on every tap so the interval restarts and doesn't flip right after.
  const [swapTimerKey, setSwapTimerKey] = useState(0);
  useFocusEffect(useCallback(() => {
    if (reduceMotion) return undefined;
    const id = setInterval(swap, AUTO_SWAP_MS);
    return () => clearInterval(id);
  }, [reduceMotion, swap, swapTimerKey]));

  const handleSwap = () => {
    swap();
    setSwapTimerKey((k) => k + 1);
  };

  // Left box: GOLD bg → BG bg
  const leftBg = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GOLD, BG],
  });
  // Right box: BG bg → GOLD bg
  const rightBg = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BG, GOLD],
  });
  // Borders are constant (see styles.boxTop): animating borderWidth 0 ↔ 1.5
  // resized both boxes mid-swap and nudged everything below up and down.

  // Text colours derived from state (instant switch is fine — bg animates)
  const leftTopColor  = topBoxesSwapped ? GOLD : INK;
  const leftMainColor = topBoxesSwapped ? GOLD : INK;
  const rightTopColor  = topBoxesSwapped ? INK  : GOLD;
  const rightMainColor = topBoxesSwapped ? INK  : GOLD;

  const goSignup = () => router.replace('/(auth)/signup');
  const goLogin  = () => router.replace('/(auth)/login');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 0. MASTHEAD NAMEPLATE ──────────────────────── */}
        <View style={styles.mastNameplate}>
          {/* "THE" kicker row */}
          <View style={styles.kickerRow}>
            <View style={styles.kickerLine} />
            <Text style={[styles.kickerText, { fontFamily: oswald700 }]}>THE</Text>
            <View style={styles.kickerLine} />
          </View>
          {/* XProHub — mixed inline styles on same baseline */}
          <View style={styles.nameplateRow}>
            <Text style={[styles.nameplateX,   { fontFamily: playfair   }]}>X</Text>
            <Text style={[styles.nameplatePro, { fontFamily: playfairIt }]}>Pro</Text>
            <Text style={[styles.nameplateHub, { fontFamily: playfair   }]}>Hub</Text>
          </View>
        </View>

        {/* ── 1. TICKER BAR ──────────────────────────────── */}
        <View style={styles.ticker}>
          <Text style={[styles.tickerText, { fontFamily: oswald700 }]}>
            {'◆  REAL WORK  ·  FAIR PAY  ·  FOR EVERYONE  ◆'}
          </Text>
        </View>

        {/* ── 2. TAGLINE BLOCK ───────────────────────────── */}
        <View style={styles.taglineBlock}>
          <Text style={[styles.tagline, { fontFamily: playfairIt }]}>
            {'"All The Work That\'s Fit To Post"'}
          </Text>
        </View>

        {/* ── 3. ORNATE DIVIDER ──────────────────────────── */}
        <OrnateDivider />

        {/* ── 4. MASTHEAD BLOCK ──────────────────────────── */}
        <View style={styles.masthead}>
          <View style={styles.eyebrowRow}>
            <View style={styles.goldSquare} />
            <Text style={[styles.eyebrow, { fontFamily: oswald700 }]}>
              {'  WELCOME TO XPROHUB'}
            </Text>
          </View>
          <Text style={[styles.headline, { fontFamily: playfair }]}>
            The Marketplace Where Skills Meet Opportunity
          </Text>
        </View>

        {/* ── 5. ORNATE DIVIDER ──────────────────────────── */}
        <OrnateDivider />

        {/* ── 6. TOP TWO BOXES + YIN-YANG ────────────────── */}
        {/*  Change 2: "NEED HELP?" → "HELP WANTED?"          */}
        {/*  Change 3/4/5: yin-yang outlined, pulsed, tappable */}
        <View style={styles.heroRow}>

          {/* Left box — animated background (Change 5) */}
          <TouchableOpacity onPress={goSignup} activeOpacity={0.85} style={styles.boxTouchable}>
            <Animated.View style={[
              styles.boxBase,
              styles.boxTop,
              { backgroundColor: leftBg },
            ]}>
              <Text style={[styles.boxTopLabel, { fontFamily: oswald700, color: leftTopColor }]}>
                HELP WANTED?
              </Text>
              <Text style={[styles.boxMainLabel, { fontFamily: oswald700, color: leftMainColor }]}>
                POST A JOB
              </Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Centre yin-yang — Change 4: pulse wrap, Change 5: tap handler */}
          <Animated.View style={[
            styles.yinYangWrap,
            { transform: [{ scale: pulseScale }] },
          ]}>
            <TouchableOpacity onPress={handleSwap} activeOpacity={0.8}>
              <YinYang />
            </TouchableOpacity>
          </Animated.View>

          {/* Right box — animated background (Change 5) */}
          <TouchableOpacity onPress={goSignup} activeOpacity={0.85} style={styles.boxTouchable}>
            <Animated.View style={[
              styles.boxBase,
              styles.boxTop,
              { backgroundColor: rightBg },
            ]}>
              <Text style={[styles.boxTopLabel, { fontFamily: oswald700, color: rightTopColor }]}>
                HAVE SKILLS?
              </Text>
              <Text style={[styles.boxMainLabel, { fontFamily: oswald700, color: rightMainColor }]}>
                TAKE A JOB
              </Text>
            </Animated.View>
          </TouchableOpacity>

        </View>

        {/* ── 7. BUILT FOR TRUST STRIP ───────────────────── */}
        <View style={styles.trustStrip}>
          <View style={styles.trustHeader}>
            <View style={styles.goldSquareSm} />
            <Text style={[styles.trustHeaderText, { fontFamily: oswald700 }]}>
              {'  BUILT FOR TRUST  '}
            </Text>
            <View style={styles.goldSquareSm} />
          </View>
          <View style={styles.trustItems}>
            <View style={styles.trustItem}>
              <LockIcon />
              <Text style={[styles.trustLabel, { fontFamily: oswald700 }]}>PROTECTED</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <ThumbsUpIcon />
              <Text style={[styles.trustLabel, { fontFamily: oswald700 }]}>ENDORSED</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <BoltIcon />
              <Text style={[styles.trustLabel, { fontFamily: oswald700 }]}>FAST</Text>
            </View>
          </View>
        </View>

        {/* ── 8. BOTTOM BOXES + DOLLAR SIGN ─────────────── */}
        <View style={styles.bottomBoxesSection}>
          <View style={styles.heroRow}>

            {/* Left bottom box — solid gold, mirrors top-left */}
            <View style={[styles.boxBase, styles.boxBottomGold]}>
              <Text style={[styles.bottomBoxLabel, { fontFamily: oswald700, color: INK }]}>
                YOUR BUDGET
              </Text>
            </View>

            {/* Centre: "SET" label + dollar sign stacked */}
            <View style={styles.dollarCenterCol}>
              <Text style={[styles.setLabel, { fontFamily: oswald700 }]}>SET</Text>
              <DollarSign />
            </View>

            {/* Right bottom box — dark + gold border, mirrors top-right */}
            <View style={[styles.boxBase, styles.boxOutline]}>
              <Text style={[styles.bottomBoxLabel, { fontFamily: oswald700, color: GOLD }]}>
                YOUR RATE
              </Text>
            </View>

          </View>
        </View>

        {/* ── 9. CTA BLOCK ───────────────────────────────── */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={goSignup}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaButtonText, { fontFamily: oswald700 }]}>
              GET STARTED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInRow}
            onPress={goLogin}
            activeOpacity={0.7}
          >
            <Text style={[styles.signInBase, { fontFamily: oswald700 }]}>
              {'Already a member? '}
              <Text style={[styles.signInLink, { fontFamily: oswald700 }]}>
                SIGN IN
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    paddingBottom: Spacing.xl,
  },

  // 0. Masthead nameplate
  mastNameplate: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  kickerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  kickerText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3.9,
  },
  nameplateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 10,
  },
  nameplateX: {
    color: Colors.gold,
    fontSize: 50,
    fontWeight: '700',
    letterSpacing: -1,
  },
  nameplatePro: {
    color: Colors.gold,
    fontSize: 50,
    fontWeight: '700',
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  nameplateHub: {
    color: Colors.gold,
    fontSize: 50,
    fontWeight: '700',
    letterSpacing: -1,
  },

  // 1. Ticker bar — Change 1: 9 → 11
  ticker: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: GOLD,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: BG,
  },
  tickerText: {
    color: Colors.textPrimary,
    fontSize: 13,
    letterSpacing: 2,
  },

  // 2. Tagline — Change 1: 15 → 18
  taglineBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  tagline: {
    color: CREAM,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Ornate divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD,
  },
  dividerDiamond: {
    color: Colors.textPrimary,
    fontSize: 13,
    marginHorizontal: 8,
    lineHeight: 17,
  },

  // 4. Masthead — Change 1: eyebrow 9 → 11, headline 21 → 26
  masthead: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldSquare: {
    width: 8,
    height: 8,
    backgroundColor: GOLD,
  },
  eyebrow: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headline: {
    color: PAPER,
    fontSize: 29,
    lineHeight: 37,
  },

  // 6. Hero row shared layout
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 22,
    gap: 12,
  },

  // Box base — shared between top and bottom boxes
  // Top boxes use Animated.View with dynamic bg; bottom boxes use static outline
  boxTouchable: {
    flex: 1,
  },
  boxBase: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top boxes: same border and fixed minimum height in both swap states, so
  // only colours change. The filled box's gold border matches its fill.
  boxTop: {
    borderWidth: 1.5,
    borderColor: GOLD,
    minHeight: 104,
  },
  // Bottom box variants — mirror top-left (gold) and top-right (dark+border)
  boxBottomGold: {
    backgroundColor: GOLD,
    borderWidth: 2,
    borderColor: GOLD,
  },
  boxOutline: {
    backgroundColor: BG,
    borderWidth: 2,
    borderColor: GOLD,
  },

  // "SET" label + dollar sign column
  dollarCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLabel: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  // Box labels — Change 1: top 10 → 13, main 15 → 20
  boxTopLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  boxMainLabel: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  // Change 6: bottom box single text line
  bottomBoxLabel: {
    color: PAPER,
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 6,
  },

  yinYangWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 7. Trust strip — Change 1: eyebrow 9 → 11, labels 9 → 11
  trustStrip: {
    borderTopWidth: 1,
    borderColor: GOLD,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: Spacing.lg,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  goldSquareSm: {
    width: 6,
    height: 6,
    backgroundColor: GOLD,
  },
  trustHeaderText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  trustItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trustDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  trustLabel: {
    color: CREAM,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.3,
  },

  // 8. Bottom boxes section — Change 6
  bottomBoxesSection: {
    borderTopWidth: 1,
    borderColor: GOLD,
  },

  // 9. CTA block — Change 1: button text 13 → 16, sign-in 11 → 13
  ctaBlock: {
    borderTopWidth: 1,
    borderColor: GOLD,
    paddingTop: 18,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: 14,
    paddingBottom: Spacing.md,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: INK,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  signInRow: {
    paddingVertical: 4,
  },
  signInBase: {
    color: CREAM,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  signInLink: {
    color: Colors.gold,
    fontSize: 15,
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
