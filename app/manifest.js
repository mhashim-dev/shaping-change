// Web App Manifest (Next App Router serves this at /manifest.webmanifest and links it).
// Makes "Shaping Change" installable and, with the service worker, usable offline —
// which suits the audience (patchy connectivity, shared/community devices).
export default function manifest() {
  return {
    name: 'Shaping Change — Building strong roots for safety',
    short_name: 'Shaping Change',
    description: 'A short, reflective activity that supports family-violence prevention.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#17110a',
    theme_color: '#17110a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  };
}
