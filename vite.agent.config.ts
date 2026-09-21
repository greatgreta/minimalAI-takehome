import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Second build: the embeddable agent as a single IIFE file at dist/agent.js.
// IIFE so `document.currentScript` resolves to the merchant's <script> tag at mount time.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/agent/agent-entry.ts'),
      name: 'MinimalAgent',
      formats: ['iife'],
      fileName: () => 'agent.js',
    },
  },
});
