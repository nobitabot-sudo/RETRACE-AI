/**
 * RETRACE AI — Product Image Mapping & Asset Registry
 * Provides stable, SKU-keyed product visuals and category fallbacks.
 * Sourced contextually across Command Centre, Returns Intelligence,
 * Recovery Optimizer, Return Detective, Supplier Quality, Deadline Hunter,
 * and Approval Centre.
 */

// Helper to encode inline SVG as a clean data URI
const createSvgDataUri = (svgString: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
};

// 1. AcoustiQ Neo Wireless ANC Headphones (WH-NEO-01) - Audio
const HEADPHONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="hp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="hp-metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="hp-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <filter id="hp-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#hp-bg)"/>
  <!-- Subtly styled grid backdrop -->
  <circle cx="100" cy="100" r="75" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>
  <!-- Headband Arc -->
  <path d="M 46 110 A 58 58 0 0 1 154 110" fill="none" stroke="url(#hp-metal)" stroke-width="9" stroke-linecap="round" filter="url(#hp-glow)"/>
  <path d="M 54 100 A 50 50 0 0 1 146 100" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
  <!-- Headband Inner Cushion -->
  <path d="M 64 88 A 42 42 0 0 1 136 88" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
  <!-- Left Hinge (Fault location: DEF-01 right hinge cluster) -->
  <rect x="42" y="104" width="8" height="14" rx="2" fill="url(#hp-metal)"/>
  <rect x="150" y="104" width="8" height="14" rx="2" fill="url(#hp-metal)"/>
  <circle cx="154" cy="111" r="2.5" fill="#ef4444" opacity="0.9"/> <!-- Subtle red indicator for reported hinge point -->
  <!-- Left Ear Cup -->
  <g filter="url(#hp-glow)">
    <rect x="30" y="112" width="26" height="48" rx="13" fill="#1e293b" stroke="url(#hp-metal)" stroke-width="2"/>
    <rect x="33" y="116" width="20" height="40" rx="10" fill="#090d16"/>
    <circle cx="43" cy="136" r="4" fill="url(#hp-accent)"/>
  </g>
  <!-- Right Ear Cup -->
  <g filter="url(#hp-glow)">
    <rect x="144" y="112" width="26" height="48" rx="13" fill="#1e293b" stroke="url(#hp-metal)" stroke-width="2"/>
    <rect x="147" y="116" width="20" height="40" rx="10" fill="#090d16"/>
    <circle cx="157" cy="136" r="4" fill="url(#hp-accent)"/>
  </g>
  <!-- Soundwave / Brand Mark -->
  <path d="M 90 145 L 94 140 L 98 150 L 102 135 L 106 148 L 110 145" fill="none" stroke="url(#hp-accent)" stroke-width="2.5" stroke-linecap="round"/>
  <text x="100" y="174" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">WH-NEO-01</text>
</svg>`;

// 2. SpectraView 32" 4K UHD Studio Monitor (MON-4K-PRO) - Displays
const MONITOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="mon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="mon-screen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369a1"/>
      <stop offset="35%" stop-color="#0284c7"/>
      <stop offset="70%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="mon-metal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <filter id="mon-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#mon-bg)"/>
  <!-- Monitor Stand Base -->
  <ellipse cx="100" cy="166" rx="34" ry="7" fill="url(#mon-metal)" filter="url(#mon-shadow)"/>
  <rect x="96" y="126" width="8" height="38" rx="2" fill="url(#mon-metal)"/>
  <!-- Bezel -->
  <rect x="22" y="38" width="156" height="98" rx="4" fill="#090d16" stroke="#475569" stroke-width="2" filter="url(#mon-shadow)"/>
  <!-- Display Screen / 4K Color Spectrum -->
  <rect x="26" y="42" width="148" height="88" rx="2" fill="url(#mon-screen)"/>
  <!-- UHD Grid calibration lines -->
  <line x1="26" y1="86" x2="174" y2="86" stroke="#ffffff" stroke-width="0.8" opacity="0.35"/>
  <line x1="100" y1="42" x2="100" y2="130" stroke="#ffffff" stroke-width="0.8" opacity="0.35"/>
  <circle cx="100" cy="86" r="22" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.45"/>
  <!-- 4K Studio Badge -->
  <rect x="134" y="46" width="36" height="12" rx="2" fill="#000000" opacity="0.6"/>
  <text x="152" y="55" text-anchor="middle" font-family="monospace" font-size="7" font-weight="700" fill="#38bdf8">4K HDR</text>
  <text x="100" y="186" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">MON-4K-PRO</text>
</svg>`;

// 3. PulseTrack Ultra LTE Smartwatch Gen 1 (WATCH-LTE-X) - Wearables
const WATCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="w-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="w-strap" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="w-dial" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="w-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#w-bg)"/>
  <!-- Top Strap -->
  <path d="M 80 20 L 120 20 L 116 70 L 84 70 Z" fill="url(#w-strap)"/>
  <!-- Bottom Strap -->
  <path d="M 84 130 L 116 130 L 120 180 L 80 180 Z" fill="url(#w-strap)"/>
  <!-- Watch Case Ring -->
  <circle cx="100" cy="100" r="48" fill="#475569" filter="url(#w-shadow)"/>
  <circle cx="100" cy="100" r="44" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
  <!-- Watch Dial Face -->
  <circle cx="100" cy="100" r="38" fill="url(#w-dial)"/>
  <!-- Fitness Activity Ring -->
  <circle cx="100" cy="100" r="28" fill="none" stroke="#334155" stroke-width="4"/>
  <circle cx="100" cy="100" r="28" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="130,50" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="22" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-dasharray="80,60" stroke-linecap="round"/>
  <!-- Digital Clock Display -->
  <text x="100" y="98" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="#f8fafc">10:42</text>
  <text x="100" y="112" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="600" fill="#38bdf8">LTE 4G</text>
  <!-- Crown Button -->
  <rect x="146" y="94" width="6" height="12" rx="2" fill="#cbd5e1"/>
  <text x="100" y="194" text-anchor="middle" font-family="monospace" font-size="8" font-weight="700" fill="#94a3b8" letter-spacing="1">WATCH-LTE-X</text>
</svg>`;

// 4. AeroPocket 4K Foldable Quadcopter (DRONE-MINI) - Drones
const DRONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="d-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="d-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="d-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#d-bg)"/>
  <!-- 4 Arms -->
  <line x1="56" y1="56" x2="144" y2="144" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
  <line x1="144" y1="56" x2="56" y2="144" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
  <!-- 4 Rotor Blades / Propeller Disks -->
  <ellipse cx="52" cy="52" rx="26" ry="7" fill="#38bdf8" opacity="0.35"/>
  <ellipse cx="148" cy="52" rx="26" ry="7" fill="#38bdf8" opacity="0.35"/>
  <ellipse cx="52" cy="148" rx="26" ry="7" fill="#38bdf8" opacity="0.35"/>
  <ellipse cx="148" cy="148" rx="26" ry="7" fill="#38bdf8" opacity="0.35"/>
  <!-- Rotor Hubs -->
  <circle cx="52" cy="52" r="5" fill="#f8fafc"/>
  <circle cx="148" cy="52" r="5" fill="#f8fafc"/>
  <circle cx="52" cy="148" r="5" fill="#f8fafc"/>
  <circle cx="148" cy="148" r="5" fill="#f8fafc"/>
  <!-- Central Quadcopter Fuselage Body -->
  <g filter="url(#d-shadow)">
    <rect x="76" y="68" width="48" height="64" rx="16" fill="url(#d-body)" stroke="#94a3b8" stroke-width="1.5"/>
    <circle cx="100" cy="80" r="6" fill="#10b981"/> <!-- Status LED -->
    <!-- Front 4K Optical Camera Gimbal -->
    <rect x="90" y="58" width="20" height="12" rx="4" fill="#020617" stroke="#38bdf8" stroke-width="1"/>
    <circle cx="100" cy="64" r="3" fill="#38bdf8"/>
  </g>
  <text x="100" y="186" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">DRONE-MINI</text>
</svg>`;

// 5. VividPad Air 10.5" Android Tablet (TAB-AIR-10) - Tablets
const TABLET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="tab-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="tab-screen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#4338ca"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="tab-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#tab-bg)"/>
  <!-- Tablet Aluminum Frame -->
  <rect x="36" y="26" width="128" height="148" rx="12" fill="#0f172a" stroke="#64748b" stroke-width="2.5" filter="url(#tab-shadow)"/>
  <!-- Tablet Display Screen -->
  <rect x="42" y="32" width="116" height="136" rx="6" fill="url(#tab-screen)"/>
  <!-- Camera Pinhole -->
  <circle cx="100" cy="29" r="1.5" fill="#94a3b8"/>
  <!-- Screen Content UI Elements -->
  <rect x="52" y="46" width="46" height="8" rx="2" fill="#ffffff" opacity="0.8"/>
  <rect x="52" y="58" width="70" height="4" rx="2" fill="#c7d2fe" opacity="0.6"/>
  <!-- App grid cards -->
  <rect x="52" y="74" width="42" height="34" rx="4" fill="#ffffff" opacity="0.15"/>
  <rect x="106" y="74" width="42" height="34" rx="4" fill="#ffffff" opacity="0.15"/>
  <!-- Bottom navigation bar -->
  <line x1="88" y1="162" x2="112" y2="162" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
  <text x="100" y="192" text-anchor="middle" font-family="monospace" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">TAB-AIR-10</text>
</svg>`;

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'WH-NEO-01': createSvgDataUri(HEADPHONE_SVG),
  'MON-4K-PRO': createSvgDataUri(MONITOR_SVG),
  'WATCH-LTE-X': createSvgDataUri(WATCH_SVG),
  'DRONE-MINI': createSvgDataUri(DRONE_SVG),
  'TAB-AIR-10': createSvgDataUri(TABLET_SVG),
};

/**
 * Resolves the appropriate image URL for a given product or SKU.
 * Precedence:
 * 1. Explicit product.image_url property on the record
 * 2. SKU-based stable mapping in PRODUCT_IMAGE_MAP
 * 3. undefined (falls back to category badge / initials in ProductImage component)
 */
export function getProductImageUrl(
  skuOrProduct?: string | { sku?: string; image_url?: string }
): string | undefined {
  if (!skuOrProduct) return undefined;

  if (typeof skuOrProduct === 'object') {
    if (skuOrProduct.image_url && skuOrProduct.image_url.trim().length > 0) {
      return skuOrProduct.image_url;
    }
    if (skuOrProduct.sku && PRODUCT_IMAGE_MAP[skuOrProduct.sku]) {
      return PRODUCT_IMAGE_MAP[skuOrProduct.sku];
    }
    return undefined;
  }

  if (typeof skuOrProduct === 'string') {
    return PRODUCT_IMAGE_MAP[skuOrProduct];
  }

  return undefined;
}
