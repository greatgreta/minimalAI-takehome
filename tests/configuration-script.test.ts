import { describe, it, expect } from 'vitest';
import { grazaProfile } from '../src/brands/profiles';
import {
  chatSteps,
  complete,
  finishReading,
  initialState,
  isFinalStep,
  queuedReply,
  reset,
  resolveConfig,
  send,
  startReading,
  type FlowState,
} from '../src/configuration/script';

const p = grazaProfile;
const chatting = (): FlowState => finishReading(startReading(initialState()));

describe('configuration script', () => {
  it('walks idle -> reading -> chat and ignores out-of-order calls', () => {
    const s0 = initialState();
    expect(s0.phase).toBe('idle');
    expect(finishReading(s0).phase).toBe('idle'); // cannot finish without starting
    const s1 = startReading(s0);
    expect(s1.phase).toBe('reading');
    expect(startReading(s1)).toBe(s1);
    const s2 = finishReading(s1);
    expect(s2).toMatchObject({ phase: 'chat', step: 0 });
    expect(complete(s0).phase).toBe('idle');
  });

  it('prefills the scripted replies in order and the last step has none', () => {
    let s = chatting();
    const labels: string[] = [];
    while (queuedReply(p, s)) {
      labels.push(queuedReply(p, s)!.label);
      s = send(p, s);
    }
    expect(labels).toEqual(['Floating, please.', 'Say hello first.', 'Chatty and vibrant, like Graza.']);
    expect(isFinalStep(p, s)).toBe(true);
    expect(send(p, s)).toBe(s); // nothing to send on the final step
    expect(complete(s).phase).toBe('done');
  });

  it('offers no reply outside the chat phase', () => {
    expect(queuedReply(p, initialState())).toBeNull();
    expect(queuedReply(p, startReading(initialState()))).toBeNull();
  });

  it('opens with the domain and summary read from the profile', () => {
    const first = chatSteps(p)[0].agent[0];
    expect(first).toContain(`I've read ${p.domain}.`);
    expect(first).toContain(p.summary);
    expect(chatSteps(p)[3].agent[1]).toContain('</body>');
  });

  it('turns the three answers into the real config', () => {
    const start = chatting();
    expect(resolveConfig(p, start).sliders).toEqual({ energy: 0.5, shape: 0.5 });

    let s = start;
    s = send(p, s);
    expect(resolveConfig(p, s).behaviour.placement).toBe('floating');
    s = send(p, s);
    expect(resolveConfig(p, s).behaviour.opening).toBe('greets');
    s = send(p, s);
    const config = resolveConfig(p, s);
    expect(config.brand).toBe(p.id);
    expect(config.behaviour).toMatchObject({ placement: 'floating', opening: 'greets' });
    // "Chatty and vibrant" moves energy only; shape stays neutral so the radii keep the brand's own.
    expect(config.sliders).toEqual({ energy: 0.7, shape: 0.5 });
  });

  it('resets from every step back to the initial state', () => {
    let s = chatting();
    const seen: FlowState[] = [initialState(), startReading(initialState()), s];
    while (queuedReply(p, s)) {
      s = send(p, s);
      seen.push(s);
    }
    seen.push(complete(s));
    expect(seen.length).toBeGreaterThan(5);
    // Reset is independent of where the flow was: every step maps back to the initial state.
    seen.forEach(() => expect(reset()).toEqual(initialState()));
  });
});
