// Graza catalogue - fictional data. Every product field is unverified (verified:false + a TODO).
// Trio.separate and trio.saving are DERIVED here, never typed by hand.

export interface GrazaProduct {
  id: string;
  name: string;
  price: number; // EUR
  size?: string;
  use?: string;
  harvest?: string;
  verified: false;
  todo: string;
}

const TODO = 'TODO: fictional value, verify against a real source before use';

const sizzle: GrazaProduct = {
  id: 'sizzle',
  name: 'Sizzle',
  price: 16,
  size: '750ml',
  use: 'cooking',
  verified: false,
  todo: TODO,
};

const drizzle: GrazaProduct = {
  id: 'drizzle',
  name: 'Drizzle',
  price: 16,
  size: '500ml',
  use: 'finishing',
  harvest: 'current',
  verified: false,
  todo: TODO,
};

const frizzle: GrazaProduct = {
  id: 'frizzle',
  name: 'Frizzle',
  price: 14,
  size: '750ml',
  use: 'high-heat',
  verified: false,
  todo: TODO,
};

const trioSeparate = sizzle.price + drizzle.price + frizzle.price; // derived, never typed
const trioPrice = 40;

const trio = {
  id: 'trio',
  name: 'The Trio',
  price: trioPrice,
  contains: [sizzle.id, drizzle.id, frizzle.id],
  separate: trioSeparate,
  saving: trioSeparate - trioPrice, // derived
  verified: false as const,
  todo: TODO,
};

const offer = {
  id: 'first-order-10',
  type: 'percentOff' as const,
  value: 10,
  appliesTo: 'next order',
  condition: 'firstOrder' as const,
  verified: false as const,
  todo: TODO,
};

export const grazaCatalogue = { brandName: 'Graza', sizzle, drizzle, frizzle, trio, offer };
export type GrazaCatalogue = typeof grazaCatalogue;
