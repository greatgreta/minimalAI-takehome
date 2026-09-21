// Entry for the Graza replica page ("/").
import { renderGrazaStore } from './graza-store';
import { mountDemoBar } from '../demo-bar/demo-bar';

renderGrazaStore(document.getElementById('store-root')!);
mountDemoBar('graza');
