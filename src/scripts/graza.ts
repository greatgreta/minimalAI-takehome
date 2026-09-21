// Graza conversation. Encoded VERBATIM from docs/graza-copy.md; the only variations are the
// {placeholders} and the two documented branches. This file knows nothing about presentation and
// never references any presentation token or voice string.
//
// Obstacle: the friend's anchor (Sizzle, a cooking oil) does not fit the shopper's use (salads,
// bread); the escape route is Drizzle (and the trio for the pan).

import type { Script } from '../agent/brain';
import type { GrazaCatalogue } from '../catalogue/graza';

export interface GrazaScriptContext {
  data: GrazaCatalogue;
  promotions: { firstOrder: boolean };
}

export function buildGrazaScript(ctx: GrazaScriptContext): Script {
  const { data } = ctx;
  const samePrice = data.sizzle.price === data.drizzle.price;
  const currentHarvest = data.drizzle.harvest === 'current';
  const offerOn = Boolean(data.offer) && ctx.promotions.firstOrder;

  const harvestSentence = currentHarvest ? " It's from the current harvest too." : '';

  const priceLine = samePrice
    ? "Same price, {drizzle.price} EUR each, so it really comes down to how you'll use it. For salads and bread, go {drizzle.name}."
    : 'Not the same: {sizzle.name} {sizzle.price} EUR, {drizzle.name} {drizzle.price} EUR. For salads and bread, go {drizzle.name}.';

  const cardLines = ['Finishing oil', '{drizzle.size}', '{drizzle.price} EUR'];
  if (currentHarvest) cardLines.push('Current harvest');

  const finalTurn = offerOn
    ? "Nice, then you get {offer.value}% off your next order. Grab {drizzle.name} now and come back for {sizzle.name} once you're cooking more, with the discount."
    : "Welcome, then. Check out when you're ready.";

  return {
    steps: [
      {
        input: {
          kind: 'text',
          text: "My friend swears by {sizzle.name}, she says it's great. I want something for salads and dipping bread, and I care that it's actually fresh. Is that the one?",
        },
        turns: [
          { kind: 'text', from: 'agent', text: 'Ooh, your friend has good taste.' },
          {
            kind: 'understanding',
            parsed: [
              { label: "Friend's pick", value: '{sizzle.name}' },
              { label: 'For', value: 'salads, dipping bread' },
              { label: 'Fresh', value: '' },
            ],
          },
          {
            kind: 'text',
            from: 'agent',
            text:
              "{sizzle.name} is your go-to when you're actually cooking: searing, roasting, big dinner energy. For salads and bread you want {drizzle.name}: the fresh, raw finish, your solo-picnic-in-the-park oil." +
              harvestSentence,
          },
        ],
      },
      {
        input: { kind: 'text', text: 'Are they the same price?' },
        turns: [
          { kind: 'text', from: 'agent', text: priceLine },
          {
            kind: 'insightCard',
            variant: 'productAction',
            title: '{drizzle.name}',
            lines: cardLines,
            action: { action: 'add-to-cart', productId: 'drizzle', label: 'Just {drizzle.name}' },
          },
          { kind: 'quickReplies', options: [{ id: 'get-trio', label: 'Get the trio' }] },
          {
            kind: 'text',
            from: 'agent',
            text: 'Still want {sizzle.name} for the pan? The trio has {sizzle.name} (cooking), {drizzle.name} (finishing) and {frizzle.name} (high-heat), {trio.price} EUR instead of {trio.separate}.',
          },
        ],
      },
      {
        input: { kind: 'reply', id: 'just-drizzle', label: 'Just {drizzle.name}' },
        turns: [
          {
            kind: 'text',
            from: 'agent',
            text: "Done, it's in your bag. Quick one before you check out: is this your first order with {brandName}?",
          },
          {
            kind: 'quickReplies',
            options: [
              { id: 'first-yes', label: 'Yes' },
              { id: 'first-no', label: 'No' },
            ],
          },
        ],
      },
      {
        input: { kind: 'reply', id: 'first-yes', label: 'Yes' },
        turns: [{ kind: 'text', from: 'agent', text: finalTurn }],
      },
    ],
  };
}
