// Maurten conversation. The opening is silent, so the script starts with the user turn.
// This file knows nothing about presentation and never references any presentation token or
// voice string. Every number, date and product name arrives via {placeholders}.
//
// Obstacle (time): the first-choice gel restocks after the race window closes; the closest gel in
// stock arrives in time and carries more carbohydrate.
// Voice: terse, numbers first, no exclamation marks, no emoji.
// Checkout is a handoff event; the agent never takes payment.

import type { Script } from '../agent/brain';

export function buildMaurtenScript(): Script {
  return {
    steps: [
      {
        input: {
          kind: 'text',
          text: "I'm training for a marathon in under 3 weeks and I always hit a wall around 30k. What should I take?",
        },
        turns: [
          {
            kind: 'understanding',
            parsed: [
              { label: 'Event', value: 'marathon' },
              { label: 'Time', value: 'under 3 weeks' },
              { label: 'Problem', value: 'wall ~30 km' },
            ],
          },
          {
            kind: 'text',
            from: 'agent',
            text: 'Wall near 30 km: stored carbohydrate usually runs low. Fuel early, not at the wall. Plans are individual. General guide: preload, fuel in race, replenish after.',
          },
          {
            kind: 'insightCard',
            variant: 'link',
            title: 'Prepare for your marathon',
            // TODO verify URL
            href: 'https://www.maurten.com/prepare-for-your-marathon',
          },
          { kind: 'text', from: 'agent', text: 'In race: {gel100.name} or {gel100caf100.name}.' },
          { kind: 'text', from: 'agent', text: 'Have you had caffeine in a race before?' },
          {
            kind: 'quickReplies',
            options: [
              { id: 'caffeine-yes', label: 'Yes' },
              { id: 'caffeine-no', label: 'No' },
            ],
          },
        ],
      },
      {
        input: { kind: 'reply', id: 'caffeine-no', label: 'No' },
        turns: [
          {
            kind: 'understanding',
            parsed: [
              { label: 'Event', value: 'marathon' },
              { label: 'Time', value: 'under 3 weeks' },
              { label: 'Problem', value: 'wall ~30 km' },
              { label: 'Caffeine in race', value: 'no' },
            ],
          },
          {
            kind: 'text',
            from: 'agent',
            text: 'Skip caffeine. Nothing new on race day. {gel100.name}. Postcode to check delivery against your race date.',
          },
        ],
      },
      {
        input: { kind: 'text', text: '{postcode.demo}' },
        turns: [
          {
            kind: 'text',
            from: 'agent',
            text: '{gel100.name}: restock {gel100.restock}. Race window ends {race.deadline}. Too late. Closest in stock: {gel160.name}, arrives {gel160.arrives}. More carbohydrate per gel.',
          },
          {
            kind: 'insightCard',
            variant: 'compare',
            title: '{gel160.name}',
            rows: [
              { label: '{gel160.name}', value: '{gel160.carbs} g' },
              { label: '{gel100.name}', value: '{gel100.carbs} g' },
              { label: 'Difference', value: '+{carbsDiff} g' },
            ],
          },
          {
            kind: 'action',
            action: 'add-to-cart',
            productId: 'gel160',
            label: 'Add to cart',
            replyId: 'add-to-cart',
          },
        ],
      },
      {
        input: { kind: 'reply', id: 'add-to-cart', label: 'Add to cart' },
        turns: [
          {
            kind: 'text',
            from: 'agent',
            text: 'Added. Arrives {gel160.arrives}. {daysLeft} days left. Test it on two long runs.',
          },
          { kind: 'action', action: 'checkout', label: 'Checkout' },
        ],
      },
    ],
  };
}
