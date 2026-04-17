import { useEffect, useRef, useState } from 'react';
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
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../../constants/theme';

// ─── Colours (all from design system) ─────────────────────────
const GOLD  = Colors.gold;        // #C9A84C
const BG    = Colors.background;  // #0E0E0F
const PAPER = '#F5EEDC';
const CREAM = '#E8DCC0';
const INK   = '#1A0F00';

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

function StarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20">
      <Polygon
        points="10,2 12.4,7.2 18,7.6 14,11.4 15.4,17 10,14 4.6,17 6,11.4 2,7.6 7.6,7.2"
        stroke={GOLD} strokeWidth={1.6} fill="none" strokeLinejoin="round"
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
  const oswald600  = fontsLoaded ? 'Oswald_600SemiBold'             : 'System';
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

  const handleSwap = () => {
    const next = !topBoxesSwapped;
    setTopBoxesSwapped(next);
    Animated.timing(swapAnim, {
      toValue: next ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // colour interpolation requires JS driver
    }).start();
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
  // Left border: 0 → 1.5
  const leftBorderWidth = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });
  // Right border: 1.5 → 0
  const rightBorderWidth = swapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 0],
  });

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
            <Text style={[styles.kickerText, { fontFamily: oswald600 }]}>THE</Text>
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
          <Text style={[styles.tickerText, { fontFamily: oswald600 }]}>
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
            <Text style={[styles.eyebrow, { fontFamily: oswald600 }]}>
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
              {
                backgroundColor: leftBg,
                borderWidth: leftBorderWidth,
                borderColor: GOLD,
              },
            ]}>
              <Text style={[styles.boxTopLabel, { fontFamily: oswald600, color: leftTopColor }]}>
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
              {
                backgroundColor: rightBg,
                borderWidth: rightBorderWidth,
                borderColor: GOLD,
              },
            ]}>
              <Text style={[styles.boxTopLabel, { fontFamily: oswald600, color: rightTopColor }]}>
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
            <Text style={[styles.trustHeaderText, { fontFamily: oswald600 }]}>
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
              <StarIcon />
              <Text style={[styles.trustLabel, { fontFamily: oswald700 }]}>RATED</Text>
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
            <Text style={[styles.signInBase, { fontFamily: oswald600 }]}>
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
    backgroundColor: GOLD,
    opacity: 0.6,
    marginHorizontal: 12,
  },
  kickerText: {
    color: GOLD,
    fontSize: 11,
    letterSpacing: 6,
  },
  nameplateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 10,
  },
  nameplateX: {
    color: GOLD,
    fontSize: 48,
    letterSpacing: -1,
  },
  nameplatePro: {
    color: GOLD,
    fontSize: 48,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  nameplateHub: {
    color: GOLD,
    fontSize: 48,
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
    color: GOLD,
    fontSize: 11,
    letterSpacing: 3,
  },

  // 2. Tagline — Change 1: 15 → 18
  taglineBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  tagline: {
    color: CREAM,
    fontSize: 18,
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
    color: GOLD,
    fontSize: 10,
    marginHorizontal: 8,
    lineHeight: 14,
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
    color: GOLD,
    fontSize: 11,
    letterSpacing: 3,
  },
  headline: {
    color: PAPER,
    fontSize: 26,
    lineHeight: 34,
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
    color: GOLD,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 6,
  },

  // Box labels — Change 1: top 10 → 13, main 15 → 20
  boxTopLabel: {
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  boxMainLabel: {
    fontSize: 20,
    letterSpacing: 1,
  },

  // Change 6: bottom box single text line
  bottomBoxLabel: {
    color: PAPER,
    fontSize: 18,
    letterSpacing: 1.5,
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
    color: GOLD,
    fontSize: 11,
    letterSpacing: 3,
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
    backgroundColor: GOLD,
    opacity: 0.5,
  },
  trustLabel: {
    color: CREAM,
    fontSize: 11,
    letterSpacing: 2,
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
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: INK,
    fontSize: 16,
    letterSpacing: 3,
  },
  signInRow: {
    paddingVertical: 4,
  },
  signInBase: {
    color: CREAM,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  signInLink: {
    color: GOLD,
    fontSize: 13,
    letterSpacing: 1.5,
    textDecorationLine: 'underline',
  },
});
