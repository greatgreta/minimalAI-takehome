// The configuration conversation as a pure state machine. No DOM, no timers: the page drives it.
// Phases: idle -> reading -> chat -> done. Reset returns to idle from anywhere.

import { defaultConfig, type AgentConfig } from '../config/codec';
import type { BrandProfile } from '../brands/profiles';

export type Phase = 'idle' | 'reading' | 'chat' | 'done';
export type AnswerId = 'placement' | 'opening' | 'vibe';

export interface Reply {
  id: AnswerId;
  label: string;
}

export interface ChatStep {
  /** Agent messages shown, in order, before the reply is queued. */
  agent: string[];
  /** The scripted user reply for this step, or null on the final step. */
  reply: Reply | null;
}

export interface FlowState {
  phase: Phase;
  /** Index of the current chat step. */
  step: number;
  answered: AnswerId[];
}

export const VIBE_LABEL = 'Chatty and vibrant';

export const READING_STEPS = [
  'Finding your colours',
  'Matching your fonts',
  'Measuring your corners and buttons',
  'Building your agent',
] as const;

export function chatSteps(profile: BrandProfile): ChatStep[] {
  return [
    {
      agent: [
        `Hi, I've read ${profile.domain}. ${profile.summary} I have three quick questions, then I'll build your agent.`,
        'Should it float above your page, or dock to the side?',
      ],
      reply: { id: 'placement', label: 'Floating, please.' },
    },
    {
      agent: ['Should it say hello first, or wait until a shopper asks?'],
      reply: { id: 'opening', label: 'Say hello first.' },
    },
    {
      agent: ["What's your vibe?"],
      reply: { id: 'vibe', label: `${VIBE_LABEL}, like ${profile.name}.` },
    },
    {
      agent: [
        `Okay, cool, perfect. The vibe on your website feels very chatty and outspoken, but also vibrant. I'll be on that.`,
        "Here is your agent. Paste this code just before the closing </body> tag of your site. On Shopify it goes in your theme's theme.liquid file. Not sure where? Send it to whoever looks after your site.",
      ],
      reply: null,
    },
  ];
}

export const SNIPPET_NOTE = 'Your settings are stored inside this code.';

export function initialState(): FlowState {
  return { phase: 'idle', step: 0, answered: [] };
}

export function reset(): FlowState {
  return initialState();
}

export function startReading(s: FlowState): FlowState {
  return s.phase === 'idle' ? { ...s, phase: 'reading' } : s;
}

export function finishReading(s: FlowState): FlowState {
  return s.phase === 'reading' ? { ...s, phase: 'chat', step: 0 } : s;
}

/** The scripted reply the composer should be prefilled with right now, if any. */
export function queuedReply(profile: BrandProfile, s: FlowState): Reply | null {
  if (s.phase !== 'chat') return null;
  return chatSteps(profile)[s.step]?.reply ?? null;
}

/** The user pressed Send: record the answer and move to the next step. */
export function send(profile: BrandProfile, s: FlowState): FlowState {
  const reply = queuedReply(profile, s);
  if (!reply) return s;
  return { ...s, step: s.step + 1, answered: [...s.answered, reply.id] };
}

export function isFinalStep(profile: BrandProfile, s: FlowState): boolean {
  return s.phase === 'chat' && s.step === chatSteps(profile).length - 1;
}

export function complete(s: FlowState): FlowState {
  return s.phase === 'chat' ? { ...s, phase: 'done' } : s;
}

/** The three answers set the real tokens: placement, opening and the vibe sliders. */
export function resolveConfig(profile: BrandProfile, s: FlowState): AgentConfig {
  const config = defaultConfig(profile.id);
  for (const id of s.answered) {
    if (id === 'placement') config.behaviour.placement = 'floating';
    if (id === 'opening') config.behaviour.opening = 'greets';
    if (id === 'vibe') config.sliders = { ...profile.sliders };
  }
  return config;
}
