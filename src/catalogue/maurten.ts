// Maurten catalogue - product NAMES are taken from the reference shop grid (real names, listed
// exactly, never invented). No prices in this catalogue. Fictional attributes carry verified:false
// + a TODO. Dates are derived from a FROZEN demo date. carbsDiff and daysLeft are derived.

import { addDays, daysBetween, formatDate, parseISO } from './util';

export interface MaurtenProduct {
  id: string;
  name: string;
  category: string;
  kind?: 'product' | 'link';
  href?: string;
  carbs?: number; // grams
  stock?: 'in' | 'out';
  restock?: Date;
  arrives?: Date;
  verified: false;
  todo: string;
}

const TODO = 'TODO: fictional attribute, verify against a real source before use';
const TODO_URL = 'TODO: verify URL';

// Frozen demo date - never Date.now(). The race window is 21 days from here.
export const demoDate = parseISO('2026-09-21');

const race = {
  windowDays: 21,
  deadline: addDays(demoDate, 21),
  verified: false as const,
  todo: TODO,
};

const gel100: MaurtenProduct = {
  id: 'gel100',
  name: 'Gel 100',
  category: 'Gels',
  carbs: 25,
  stock: 'out',
  restock: addDays(race.deadline, 2), // after the deadline -> too late
  verified: false,
  todo: TODO,
};

const gel100caf100: MaurtenProduct = {
  id: 'gel100caf100',
  name: 'Gel 100 Caf 100',
  category: 'Gels',
  verified: false,
  todo: TODO,
};

const gel160: MaurtenProduct = {
  id: 'gel160',
  name: 'Gel 160',
  category: 'Gels',
  carbs: 40,
  stock: 'in',
  arrives: addDays(demoDate, 3), // before the deadline
  verified: false,
  todo: TODO,
};

const drinkMix160: MaurtenProduct = {
  id: 'drinkMix160',
  name: 'Drink Mix 160',
  category: 'Drink Mixes',
  verified: false,
  todo: TODO,
};

const drinkMix320: MaurtenProduct = {
  id: 'drinkMix320',
  name: 'Drink Mix 320',
  category: 'Drink Mixes',
  verified: false,
  todo: TODO,
};

const solid160: MaurtenProduct = {
  id: 'solid160',
  name: 'Solid 160',
  category: 'Solids',
  verified: false,
  todo: TODO,
};

const solidC160: MaurtenProduct = {
  id: 'solidC160',
  name: 'Solid C160',
  category: 'Solids',
  verified: false,
  todo: TODO,
};

const bicarbSystem: MaurtenProduct = {
  id: 'bicarbSystem',
  name: 'Bicarb System',
  category: 'Bicarb',
  verified: false,
  todo: TODO,
};

const fuelPlanner: MaurtenProduct = {
  id: 'fuelPlanner',
  name: 'Fuel Planner',
  category: 'Planner',
  kind: 'link',
  href: 'https://www.maurten.com/fuel-planner',
  verified: false,
  todo: TODO_URL,
};

// Postcode check: validated once, in memory, never stored. See the delivery-check spy test.
export const postcode = {
  regex: /^\d{4}\s?[A-Z]{2}$/i,
  demo: '1012 AB',
  verified: false as const,
  todo: TODO,
};

/** Grid order for the shop replica. */
export const maurtenProducts: MaurtenProduct[] = [
  gel100,
  gel100caf100,
  gel160,
  drinkMix160,
  drinkMix320,
  solid160,
  solidC160,
  bicarbSystem,
  fuelPlanner,
];

export const maurtenCatalogue = {
  brandName: 'Maurten',
  gel100,
  gel100caf100,
  gel160,
  drinkMix160,
  drinkMix320,
  solid160,
  solidC160,
  bicarbSystem,
  fuelPlanner,
  race,
  products: maurtenProducts,
  postcode,
  demoDate,
  // derived, never typed:
  carbsDiff: (gel160.carbs ?? 0) - (gel100.carbs ?? 0),
  daysLeft: daysBetween(demoDate, race.deadline),
};

export type MaurtenCatalogue = typeof maurtenCatalogue;

// Re-export for convenience in tests.
export { formatDate };
