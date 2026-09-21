// Side-effect module: register every brand (tokens + pack) into the registry. The agent entry
// imports this so the agent can look up any brand id without its code ever naming one.

import { registerBrand } from './registry';
import { graza } from './graza';
import { maurten } from './maurten';
import { grazaCatalogue } from '../catalogue/graza';
import { maurtenCatalogue } from '../catalogue/maurten';
import { buildGrazaScript } from '../scripts/graza';
import { buildMaurtenScript } from '../scripts/maurten';

registerBrand('graza', graza, {
  data: grazaCatalogue,
  script: (promotions) => buildGrazaScript({ data: grazaCatalogue, promotions }),
});

registerBrand('maurten', maurten, {
  data: maurtenCatalogue,
  script: () => buildMaurtenScript(),
});
