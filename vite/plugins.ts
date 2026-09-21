import type { Plugin, Connect } from 'vite';
import '../src/brands/register';
import { buildSnippet, defaultConfig } from '../src/config/codec';

/**
 * Map clean URLs to their .html entry so local dev + preview match Vercel `cleanUrls`.
 * "/" -> index.html, "/maurten" -> maurten.html, "/configuration" -> configuration.html.
 */
const CLEAN_ROUTES: Record<string, string> = {
  '/maurten': '/maurten.html',
  '/configuration': '/configuration.html',
};

function cleanUrlMiddleware(): Connect.NextHandleFunction {
  return (req, _res, next) => {
    if (!req.url) return next();
    const [path, query = ''] = req.url.split('?');
    const clean = path.replace(/\/$/, '');
    if (CLEAN_ROUTES[clean]) {
      req.url = CLEAN_ROUTES[clean] + (query ? `?${query}` : '');
    }
    next();
  };
}

/** Serve /agent.js in dev by importing the source entry as a module. */
function devAgentMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next();
    const path = req.url.split('?')[0];
    if (path === '/agent.js') {
      res.setHeader('Content-Type', 'application/javascript');
      // A classic script cannot use `import`, so inject a module script pointing at source.
      res.end(
        `var s=document.createElement('script');s.type='module';` +
          `s.src='/src/agent/agent-entry.ts';document.head.appendChild(s);`,
      );
      return;
    }
    next();
  };
}

export function cleanUrls(): Plugin {
  return {
    name: 'minimal-clean-urls',
    configureServer(server) {
      server.middlewares.use(cleanUrlMiddleware());
      server.middlewares.use(devAgentMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(cleanUrlMiddleware());
    },
  };
}

/**
 * Inject the exact merchant `<script>` snippet into a store page, generated from the brand
 * config with the Phase 1 codec + buildSnippet. Runs in dev and at build time so the pages
 * always contain precisely what a merchant would paste.
 *
 * Phase 0: the codec/brands do not exist yet, so this degrades to a plain snippet with no
 * data-config. Phase 2 wires it to the real `buildSnippet`.
 */
export function injectAgentSnippet(): Plugin {
  const pageBrand: Record<string, string> = {
    'index.html': 'graza',
    'maurten.html': 'maurten',
  };

  function snippetFor(brandId: string): string {
    // Same codec + buildSnippet a merchant's configuration page will use. Relative origin so the
    // snippet works on any host (dev, preview, deploy).
    return buildSnippet(defaultConfig(brandId), '');
  }

  return {
    name: 'minimal-inject-agent-snippet',
    transformIndexHtml: {
      // 'post' so Vite's own <script> scan has already run and does not try to bundle /agent.js.
      order: 'post',
      handler(html, ctx) {
        const file = ctx.filename ? ctx.filename.split('/').pop() ?? '' : '';
        const brandId = pageBrand[file];
        if (!brandId) return html;
        return html.replace('<!--agent-snippet-->', snippetFor(brandId));
      },
    },
  };
}
