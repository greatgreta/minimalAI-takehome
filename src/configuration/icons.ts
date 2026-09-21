// Inline SVG icons. All decorative (aria-hidden) and drawn with currentColor, so the stylesheet owns
// their colour.

const svg = (w: number, h: number, body: string, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

export const plusIcon = svg(
  14,
  14,
  '<rect x="0.75" y="0.75" width="12.5" height="12.5" rx="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M7 4v6M4 7h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
);

export const micIcon = svg(
  12,
  16,
  '<rect x="3.25" y="0.75" width="5.5" height="9.5" rx="2.75" fill="currentColor"/><path d="M1 7.5a5 5 0 0 0 10 0M6 12.5V15" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
);

export const arrowIcon = svg(
  14,
  14,
  '<path d="M7 11.5V2.5M3 6.5l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
);

export const tickIcon = svg(
  14,
  14,
  '<circle cx="7" cy="7" r="6.25" stroke="currentColor" stroke-width="1"/><path d="M4.2 7.2l2 2 3.6-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
);

export const pendingIcon = svg(14, 14, '<circle cx="7" cy="7" r="6.25" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>');
