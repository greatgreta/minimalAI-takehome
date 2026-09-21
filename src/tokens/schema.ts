// Semantic token schema. Roles only - no brand values live here (those are in src/brands/*.ts).
// The agent is styled entirely from these tokens, emitted as --agent-* custom properties.

export interface ColorTokens {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  line: string;
  accent: string;
  onAccent: string;
  danger: string;
  success: string;
}

export interface TypeStyle {
  family: string;
  weight: number;
  /** rem */
  size: number;
  lineHeight: number;
}

export interface TypeTokens {
  display: TypeStyle;
  body: TypeStyle;
  small: TypeStyle;
}

export interface RadiusScale {
  /** px */
  sm: number;
  md: number;
  lg: number;
  /** px; a large value renders as a pill */
  pill: number;
}

export interface ShapeTokens {
  radius: RadiusScale;
  /** border width in px */
  border: number;
}

export interface MotionTokens {
  /** ms */
  duration: number;
  easing: string;
}

export type Placement = 'floating' | 'docked';

export interface BehaviourTokens {
  opening: 'greets' | 'silent';
  understanding: 'in-chat' | 'strip';
}

export interface VoiceTokens {
  placeholder: string;
  greeting?: string;
  understandingLead?: string;
  /** Any further brand strings the renderer may surface. */
  [key: string]: string | undefined;
}

export interface Tokens {
  color: ColorTokens;
  type: TypeTokens;
  shape: ShapeTokens;
  /** spacing/compactness multiplier, ~0.85 (dense) .. ~1.15 (airy); 1 is neutral */
  density: number;
  motion: MotionTokens;
  placement: Placement;
  behaviour: BehaviourTokens;
  voice: VoiceTokens;
}

/** Text/background pairs the contrast guard must keep readable. */
export const TEXT_PAIRS: ReadonlyArray<{
  fg: keyof ColorTokens;
  bg: keyof ColorTokens;
  label: string;
}> = [
  { fg: 'ink', bg: 'bg', label: 'ink on bg' },
  { fg: 'ink', bg: 'surface', label: 'ink on surface' },
  { fg: 'inkMuted', bg: 'bg', label: 'inkMuted on bg' },
  { fg: 'inkMuted', bg: 'surface', label: 'inkMuted on surface' },
  { fg: 'onAccent', bg: 'accent', label: 'onAccent on accent' },
  { fg: 'danger', bg: 'surface', label: 'danger on surface' },
  { fg: 'success', bg: 'surface', label: 'success on surface' },
];

/** Deep clone so slider/override passes never mutate a brand's source tokens. */
export function cloneTokens(t: Tokens): Tokens {
  return {
    color: { ...t.color },
    type: {
      display: { ...t.type.display },
      body: { ...t.type.body },
      small: { ...t.type.small },
    },
    shape: { radius: { ...t.shape.radius }, border: t.shape.border },
    density: t.density,
    motion: { ...t.motion },
    placement: t.placement,
    behaviour: { ...t.behaviour },
    voice: { ...t.voice },
  };
}
