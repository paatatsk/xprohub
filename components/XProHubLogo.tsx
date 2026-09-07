// components/XProHubLogo.tsx
// The XProHub logo (v2 — corrected knot↔wordmark spacing) as a native,
// recolourable SVG.
//
//   <XProHubLogo width={200} />                    → lockup, brand gold
//   <XProHubLogo variant="mark" width={40} />      → knot only, brand gold
//   <XProHubLogo variant="mark" width={64} color="#FFFFFF" />
//
// Source: assets/logo/lockup-gap12-gold.svg / mark-gold.svg.
// The lockup renders the shared <path> TWICE — once clipped to the knot,
// once dropped 12 units and clipped to the wordmark — which IS the gap fix.
// Do not flatten. See assets/logo/xprohub-logo-path.ts.

import { useId } from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { Colors } from '../constants/theme';
import {
  XPROHUB_LOGO_PATH,
  XPROHUB_LOCKUP_VIEWBOX,
  XPROHUB_MARK_VIEWBOX,
  XPROHUB_CLIP_MARK,
  XPROHUB_CLIP_WORDMARK,
  XPROHUB_WORDMARK_DROP,
  XPROHUB_LOGO_GROUP_TRANSFORMS,
} from '../assets/logo/xprohub-logo-path';

type Variant = 'lockup' | 'mark';

interface XProHubLogoProps {
  /** Rendered width in px. Height follows the artwork's aspect ratio. */
  width: number;
  /** "lockup" (knot + wordmark, default) or "mark" (knot only, square). */
  variant?: Variant;
  /** Any colour string. Defaults to the design-system gold (#C9A84C). */
  color?: string;
}

const [T0, T1, T2] = XPROHUB_LOGO_GROUP_TRANSFORMS;

export const XPROHUB_LOCKUP_ASPECT =
  XPROHUB_LOCKUP_VIEWBOX.width / XPROHUB_LOCKUP_VIEWBOX.height; // ~0.906
export const XPROHUB_MARK_ASPECT =
  XPROHUB_MARK_VIEWBOX.width / XPROHUB_MARK_VIEWBOX.height;     // 1.0 (square)

// The artwork wrapped in its three nested group translates, exactly as the
// source SVG nests it inside each clipped group.
function Artwork({ color }: { color: string }) {
  return (
    <G transform={T0}>
      <G transform={T1}>
        <G transform={T2}>
          <Path d={XPROHUB_LOGO_PATH} fill={color} />
        </G>
      </G>
    </G>
  );
}

export function XProHubLogo({
  width,
  variant = 'lockup',
  color = Colors.gold,
}: XProHubLogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cmId = `xph-cm-${uid}`; // clip: knot
  const cwId = `xph-cw-${uid}`; // clip: wordmark

  const vb = variant === 'mark' ? XPROHUB_MARK_VIEWBOX : XPROHUB_LOCKUP_VIEWBOX;
  const height = (width * vb.height) / vb.width;
  const viewBox = `${vb.minX} ${vb.minY} ${vb.width} ${vb.height}`;

  if (variant === 'mark') {
    // Single render, clipped to the knot — matches mark-gold.svg.
    return (
      <Svg width={width} height={height} viewBox={viewBox} accessibilityLabel="XProHub logo">
        <Defs>
          <ClipPath id={cmId}>
            <Rect
              x={XPROHUB_CLIP_MARK.x}
              y={XPROHUB_CLIP_MARK.y}
              width={XPROHUB_CLIP_MARK.width}
              height={XPROHUB_CLIP_MARK.height}
            />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${cmId})`}>
          <Artwork color={color} />
        </G>
      </Svg>
    );
  }

  // Lockup — two renders, matching lockup-gap12-gold.svg:
  //   1. clipped to the knot
  //   2. translated down XPROHUB_WORDMARK_DROP, clipped to the wordmark
  return (
    <Svg width={width} height={height} viewBox={viewBox} accessibilityLabel="XProHub logo">
      <Defs>
        <ClipPath id={cmId}>
          <Rect
            x={XPROHUB_CLIP_MARK.x}
            y={XPROHUB_CLIP_MARK.y}
            width={XPROHUB_CLIP_MARK.width}
            height={XPROHUB_CLIP_MARK.height}
          />
        </ClipPath>
        <ClipPath id={cwId}>
          <Rect
            x={XPROHUB_CLIP_WORDMARK.x}
            y={XPROHUB_CLIP_WORDMARK.y}
            width={XPROHUB_CLIP_WORDMARK.width}
            height={XPROHUB_CLIP_WORDMARK.height}
          />
        </ClipPath>
      </Defs>

      <G clipPath={`url(#${cmId})`}>
        <Artwork color={color} />
      </G>

      <G transform={`translate(0,${XPROHUB_WORDMARK_DROP})`}>
        <G clipPath={`url(#${cwId})`}>
          <Artwork color={color} />
        </G>
      </G>
    </Svg>
  );
}
