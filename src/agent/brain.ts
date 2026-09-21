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
      /** Script reply id this button plays when tapped. Absent means a handoff (e.g. checkout). */
      replyId?: string;
    };

export type InsightCard =
  | { variant: 'compare'; title: string; rows: CompareRow[]; note?: string }
  | { variant: 'why'; title: string; body: string }
  | { variant: 'link'; title: string; href: string }
  | {
      variant: 'productAction';
      title: string;
      lines: string[];
      action: { action: 'add-to-cart'; productId: string; label: string; replyId?: string };
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

/**
 * A side reply: a quick reply that is not on the main path. Tapping it plays `turns` and leaves the
 * script where it is, so the main path can still continue afterwards.
 */
export interface Branch {
  label: string;
  turns: Turn[];
}

export interface Script {
  steps: ScriptStep[];
  branches?: Record<string, Branch>;
}

export interface BrainState {
  index: number;
}

export interface BrainOutput {
  turns: Turn[];
  state: BrainState;
  done: boolean;
  /**
   * Index of the main step that will answer any controls in these turns (the state index after the
   * turns play). Controls are stale once the script has moved past it.
   */
  step: number;
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
  /** Whether `id` is a side branch (playable without advancing the script). */
  isBranch(id: string): boolean;
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

  isBranch(id: string): boolean {
    return Boolean(this.script.branches?.[id]);
  }

  next(event: AgentEvent, state: BrainState): BrainOutput {
    if (event.type === 'reset') {
      return { turns: [], state: this.initial(), done: this.script.steps.length === 0, step: 0 };
    }

    const step = this.script.steps[state.index];

    // A side branch: echo the choice, play its turns, and do not advance.
    if (event.type === 'reply') {
      const branch = this.script.branches?.[event.id];
      const isMainReply = step?.input?.kind === 'reply' && step.input.id === event.id;
      if (branch && !isMainReply) {
        return {
          turns: [{ kind: 'text', from: 'user', text: branch.label }, ...branch.turns],
          state,
          done: state.index >= this.script.steps.length,
          step: state.index,
        };
      }
    }

    if (!step) {
      return { turns: [], state, done: true, step: state.index };
    }

    // 'open' only advances an opening (input === null) step.
    if (event.type === 'open' && step.input !== null) {
      return { turns: [], state, done: false, step: state.index };
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
      step: nextIndex,
    };
  }
}
