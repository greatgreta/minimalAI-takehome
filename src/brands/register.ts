// Side-effect module: register every brand into the registry. The agent entry imports this so
// resolveTokens can look up any brand id without the agent code ever naming one.

import { registerBrand } from './registry';
import { graza } from './graza';
import { maurten } from './maurten';

registerBrand('graza', graza);
registerBrand('maurten', maurten);
