import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cleanUrls, injectAgentSnippet } from './vite/plugins';

// Multi-page build: the two store replicas + the (empty) configuration page.
export default defineConfig({
  appType: 'mpa',
  plugins: [cleanUrls(), injectAgentSnippet()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        maurten: resolve(__dirname, 'maurten.html'),
        configuration: resolve(__dirname, 'configuration.html'),
      },
    },
  },
});
