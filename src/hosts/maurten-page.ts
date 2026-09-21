// Entry for the Maurten replica page ("/maurten").
import { renderMaurtenStore } from './maurten-store';
import { mountDemoBar } from '../demo-bar/demo-bar';

renderMaurtenStore(document.getElementById('store-root')!);
mountDemoBar('maurten');
