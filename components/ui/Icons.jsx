// Lightweight inline SVG icon set (no UI library dependency)
const P = ({ children, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" {...props}>
    {children}
  </svg>
);

export const Icon = {
  grid: ({ className }) => <P className={className}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></P>,
  layout: ({ className }) => <P className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></P>,
  brush: ({ className }) => <P className={className}><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13.34"/><path d="M18 2l4 4-8 8H10v-4l8-8z"/></P>,
  drop: ({ className }) => <P className={className}><path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z"/></P>,
  restaurant: ({ className }) => <P className={className}><path d="M3 11h18"/><path d="M12 11V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7"/><path d="M17 11v9"/><path d="M5 20h14"/></P>,
  plant: ({ className }) => <P className={className}><path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 7-7v14z"/><path d="M13 8a5 5 0 0 1 5-5c1 3 .5 5-2 6"/><path d="M13 13c2-1 4-1 5 0"/><path d="M12 20h5"/></P>,
  parking: ({ className }) => <P className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></P>,
  building: ({ className }) => <P className={className}><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></P>,
  gem: ({ className }) => <P className={className}><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></P>,
  landscape: ({ className }) => <P className={className}><path d="m3 20 6-11 4 7 3-5 5 9H3z"/><circle cx="18" cy="6" r="2"/></P>,
  showers: ({ className }) => <P className={className}><path d="M4 12h16"/><path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6"/><path d="M4 4v8"/><path d="M12 4v2"/></P>,
  fittings: ({ className }) => <P className={className}><path d="M12 3v4"/><path d="M8 7h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V7z"/><path d="M12 14v7"/></P>,
  construction: ({ className }) => <P className={className}><path d="M3 21h18"/><path d="M5 21V7l5-3 5 3v14"/><path d="M10 4v17"/><path d="M15 10h4v11"/></P>,
  mapPin: ({ className }) => <P className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></P>,
  ruler: ({ className }) => <P className={className}><rect x="2" y="9" width="20" height="6" rx="1" transform="rotate(-45 12 12)"/><path d="m6 13 2-2M10 17l2-2"/></P>,
  palette: ({ className }) => <P className={className}><path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3c.5.6.2 1.7-1 1.7H12z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></P>,
  stack: ({ className }) => <P className={className}><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></P>,
  contrast: ({ className }) => <P className={className}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z"/></P>,
  search: ({ className }) => <P className={className}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></P>,
  heart: ({ className }) => <P className={className}><path d="M19.5 5.5a5 5 0 0 0-7.5 0 5 5 0 0 0-7.5 7.5l7.5 7.5 7.5-7.5a5 5 0 0 0 0-7.5z"/></P>,
  bag: ({ className }) => <P className={className}><path d="M6 2h12l2 19H4L6 2z"/><path d="M9 6a3 3 0 0 1 6 0"/></P>,
  scales: ({ className }) => <P className={className}><path d="m16 3 5 5-5 5"/><path d="M21 8H9"/><path d="M8 21l-5-5 5-5"/><path d="M3 16h12"/></P>,
  user: ({ className }) => <P className={className}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></P>,
  moon: ({ className }) => <P className={className}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></P>,
  sun: ({ className }) => <P className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></P>,
  menu: ({ className }) => <P className={className}><path d="M3 6h18M3 12h18M3 18h18"/></P>,
  close: ({ className }) => <P className={className}><path d="M18 6 6 18M6 6l12 12"/></P>,
  chevronDown: ({ className }) => <P className={className}><path d="m6 9 6 6 6-6"/></P>,
  chevronLeft: ({ className }) => <P className={className}><path d="m15 18-6-6 6-6"/></P>,
  chevronRight: ({ className }) => <P className={className}><path d="m9 18 6-6-6-6"/></P>,
  chat: ({ className }) => <P className={className}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></P>,
  layers: ({ className }) => <P className={className}><path d="M12 3 3 7.5 12 12l9-4.5L12 3z"/><path d="m3 12.5 9 4.5 9-4.5"/></P>,
  phoneCall: ({ className }) => <P className={className}><path d="M14.5 3a6.5 6.5 0 0 1 6.5 6.5"/><path d="M14 7a3 3 0 0 1 3 3"/><path d="M20 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.8 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 2.2 5.5 1.8 1.8 0 0 1 4 3.5h2.6a1.8 1.8 0 0 1 1.8 1.6c.1.8.3 1.6.6 2.3a1.8 1.8 0 0 1-.4 1.9L7.5 10.5a14 14 0 0 0 5.4 5.4l1.2-1.1a1.8 1.8 0 0 1 1.9-.4c.7.3 1.5.5 2.3.6a1.8 1.8 0 0 1 1.7 1.9z"/></P>,
  arrowRight: ({ className }) => <P className={className}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></P>,
  fire: ({ className }) => <P className={className}><path d="M12 22c4.4 0 7-2.8 7-7 0-3.5-2.2-6-4-8 .3 2-.3 3.5-1.5 4.5C13.5 9 12.5 7 12 4c-2 2-4 5-4 9 0 4.4 2.5 9 4 9z"/></P>,
  phone: ({ className }) => <P className={className}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.5-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.8 2z"/></P>,
  mail: ({ className }) => <P className={className}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6L22 7"/></P>,
  whatsapp: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24zm-4.5 4.44c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.62s1.13 3.04 1.29 3.25c.16.21 2.18 3.33 5.29 4.54 2.58 1.02 3.11.82 3.67.76.56-.05 1.8-.73 2.06-1.45.25-.71.25-1.32.18-1.45-.08-.13-.29-.21-.6-.36-.31-.16-1.8-.89-2.09-.99-.28-.1-.48-.16-.68.16-.21.31-.79.98-.96 1.19-.18.21-.36.23-.66.08-.31-.16-1.29-.48-2.46-1.52-.91-.81-1.53-1.81-1.71-2.12-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.55.15-.18.2-.31.3-.52.1-.21.05-.39-.03-.55-.08-.16-.68-1.66-.94-2.27-.25-.6-.5-.52-.68-.53h-.58z"/>
    </svg>
  ),
  star: ({ className }) => <P className={className}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"/></P>,
  eye: ({ className }) => <P className={className}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></P>,
  filter: ({ className }) => <P className={className}><path d="M4 6h16M7 12h10M10 18h4"/></P>,
  collection: ({ className }) => <P className={className}><rect x="4" y="4" width="12" height="12" rx="2"/><path d="M8 4V2.5A1.5 1.5 0 0 1 9.5 1h11A1.5 1.5 0 0 1 22 2.5v11a1.5 1.5 0 0 1-1.5 1.5H19"/></P>,
  package: ({ className }) => <P className={className}><path d="m7.5 4.5 9 0 5 5v11a1.5 1.5 0 0 1-1.5 1.5h-16A1.5 1.5 0 0 1 2.5 20.5v-11l5-5z"/><path d="M2.5 9.5h19"/><path d="M12 4.5V14"/><path d="M8 14h8"/></P>,
  starFill: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"/>
    </svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-8.2h2.75l.4-3.2h-3.15V7.4c0-.93.26-1.56 1.6-1.56h1.7V2.98A22.7 22.7 0 0 0 14.3 2.8c-2.4 0-4.05 1.47-4.05 4.16v2.62H7.5v3.2h2.75V21h3.25z"/>
    </svg>
  ),
  instagram: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c-2.72 0-3.06.01-4.12.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.53 5.45c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 0 0 1.15 1.77 4.9 4.9 0 0 0 1.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.12-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 0 0 1.77-1.15 4.9 4.9 0 0 0 1.15-1.77c.25-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 0 0-1.15-1.77 4.9 4.9 0 0 0-1.77-1.15c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.2 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.3.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.2 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.88.3-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.2-1.86-.34a3.1 3.1 0 0 1-1.15-.75 3.1 3.1 0 0 1-.75-1.15c-.14-.36-.3-.88-.34-1.86C3.81 14.99 3.8 14.67 3.8 12s.01-2.99.06-4.04c.04-.98.2-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.88-.3 1.86-.34C9.01 3.81 9.33 3.8 12 3.8zm0 3.07a5.13 5.13 0 1 0 0 10.26 5.13 5.13 0 0 0 0-10.26zm0 8.46a3.33 3.33 0 1 1 0-6.66 3.33 3.33 0 0 1 0 6.66zm5.34-8.66a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
    </svg>
  ),
  twitter: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 3H22l-7.2 8.23L23 21h-6.66l-5.2-6.42L5.14 21H2l7.7-8.8L1.5 3h6.83l4.7 5.87L18.9 3zm-1.16 16.17h1.7L7.34 4.75H5.52L17.74 19.17z"/>
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.94 5a2.06 2.06 0 1 1-4.12 0 2.06 2.06 0 0 1 4.12 0zM3.1 8.4h3.7V21H3.1V8.4zm6.5 0h3.55v1.72h.05c.5-.9 1.7-1.85 3.5-1.85 3.74 0 4.43 2.36 4.43 5.43V21h-3.7v-6.6c0-1.57-.03-3.6-2.24-3.6-2.25 0-2.59 1.7-2.59 3.48V21H9.6V8.4z"/>
    </svg>
  ),
  youtube: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23 12s0-3.36-.43-4.98a3 3 0 0 0-2.1-2.1C18.85 4.5 12 4.5 12 4.5s-6.85 0-8.47.42a3 3 0 0 0-2.1 2.1C1 8.64 1 12 1 12s0 3.36.43 4.98a3 3 0 0 0 2.1 2.1c1.62.42 8.47.42 8.47.42s6.85 0 8.47-.42a3 3 0 0 0 2.1-2.1C23 15.36 23 12 23 12zM9.75 15.5v-7l6 3.5-6 3.5z"/>
    </svg>
  )
};

// Maps a category's `icon` key from the menu data to a glyph. Lives here rather
// than in Header so the mobile drawer can use it without importing Header
// (which imports the drawer — a cycle).
const NAV_ICONS = {
  grid: Icon.grid,
  layout: Icon.layout,
  brush: Icon.brush,
  drop: Icon.drop,
  restaurant: Icon.restaurant,
  plant: Icon.plant,
  parking: Icon.parking,
  building: Icon.building,
  gem: Icon.gem,
  landscape: Icon.landscape,
  showers: Icon.showers,
  fittings: Icon.fittings,
  construction: Icon.construction
};

export function NavIcon({ id, className }) {
  const C = NAV_ICONS[id] || Icon.grid;
  return <C className={className} />;
}

// Looks up any glyph in the full Icon set by key (unlike NavIcon, not limited
// to the main-nav subset) — used for the DB-driven facet group icons
// (mapPin/ruler/palette/stack/brush/contrast) coming back from category_groups.
export function AnyIcon({ id, className }) {
  const C = Icon[id] || Icon.grid;
  return <C className={className} />;
}

