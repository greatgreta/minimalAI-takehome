// Auto-mounting entry compiled to dist/agent.js (IIFE so document.currentScript works).
// Reads its own <script data-config="..."> and appends <minimal-agent>. With no data-config it
// mounts the neutral default.

import './element';

const script = document.currentScript as HTMLScriptElement | null;
const config = script?.dataset.config;

function mount(): void {
  if (document.querySelector('minimal-agent')) return; // idempotent
  const agent = document.createElement('minimal-agent');
  if (config) agent.setAttribute('config', config);
  document.body.append(agent);
}

if (document.body) mount();
else document.addEventListener('DOMContentLoaded', mount, { once: true });
