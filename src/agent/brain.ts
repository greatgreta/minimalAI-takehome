// The brain contract. A brain turns user events into agent turns. ScriptedBrain walks a fixed
// script; the interface exists so an LLM brain could replace it later (do NOT build one here).
//
// Turns are presentation-agnostic. Text carries {placeholders} that a renderer resolves against
// the brand's data. An `understanding` turn always carries a non-empty `parsed` list; the brand's
// `understanding` token (in-chat vs strip), not the script, decides how it is shown.

export interface Constraint {
  /** e.g. "For" */
  label: string;
  /** e.g. "salads, dipping bread" */
  value: string;
}

export interface QuickReply {
  id: string;
  label: string;
}

export interface CompareRow {
  label: string;
  value: string;
}

export type Turn =
  | { kind: 'text'; from: 'agent' | 'user'; text: string }
  | { kind: 'quickReplies'; options: QuickReply[] }
  | { kind: 'understanding'; parsed: Constraint[] }
  | ({ kind: 'insightCard' } & InsightCard)
  | {
      kind: 'action';
      action: 'add-to-cart' | 'checkout';
      productId?: string;
      label: string;
    };

export type InsightCard =
  | { variant: 'compare'; title: string; rows: CompareRow[]; note?: string }
  | { variant: 'why'; title: string; body: string }
  | { variant: 'link'; title: string; href: string }
  | {
      variant: 'productAction';
      title: string;
      lines: string[];
      action: { action: 'add-to-cart'; productId: string; label: string };
    };

/** A single scripted exchange: what the user does, and how the agent replies. */
export interface ScriptStep {
  /**
   * The user action that triggers this step. `null` marks an opening agent-only step (used only
   * when the brand opens by greeting). A `text` input is pre-filled in the composer; a `reply`
   * input is a tap on the previous turn's quick replies / chips.
   */
  input:
    | null
    | { kind: 'text'; text: string }
    | { kind: 'reply'; id: string; label: string };
  turns: Turn[];
}

export interface Script {
  steps: ScriptStep[];
}

export interface BrainState {
  index: number;
}

export interface BrainOutput {
  turns: Turn[];
  state: BrainState;
  done: boolean;
}

export type AgentEvent =
  | { type: 'open' }
  | { type: 'send'; text?: string }
  | { type: 'reply'; id: string }
  | { type: 'reset' };

export interface AgentBrain {
  initial(): BrainState;
  next(event: AgentEvent, state: BrainState): BrainOutput;
  /** The user input the composer should present next, if any (text to pre-fill or replies to tap). */
  pending(state: BrainState): ScriptStep['input'];
}

export class ScriptedBrain implements AgentBrain {
  constructor(private readonly script: Script) {}

  initial(): BrainState {
    return { index: 0 };
  }

  pending(state: BrainState): ScriptStep['input'] {
    const step = this.script.steps[state.index];
    return step ? step.input : null;
  }

  next(event: AgentEvent, state: BrainState): BrainOutput {
    if (event.type === 'reset') {
      return { turns: [], state: this.initial(), done: this.script.steps.length === 0 };
    }

    const step = this.script.steps[state.index];
    if (!step) {
      return { turns: [], state, done: true };
    }

    // 'open' only advances an opening (input === null) step.
    if (event.type === 'open' && step.input !== null) {
      return { turns: [], state, done: false };
    }

    const turns: Turn[] = [];
    // Echo the user's action into the transcript (unless it is an opening step).
    if (step.input && step.input.kind === 'text') {
      turns.push({ kind: 'text', from: 'user', text: step.input.text });
    } else if (step.input && step.input.kind === 'reply') {
      turns.push({ kind: 'text', from: 'user', text: step.input.label });
    }
    turns.push(...step.turns);

    const nextIndex = state.index + 1;
    return {
      turns,
      state: { index: nextIndex },
      done: nextIndex >= this.script.steps.length,
    };
  }
}
