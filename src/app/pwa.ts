import type { ManifestOptions } from 'vite-plugin-pwa'

export const PWA_BASE = '/ditdah/'

export const PWA_INCLUDE_ASSETS = [
  'favicon.ico',
  'icon.svg',
  'apple-touch-icon-180x180.png',
] as const

export const PWA_MANIFEST = {
  name: 'ditdah — learn Morse by sound',
  short_name: 'ditdah',
  description: 'A fast, beautiful, sound-first Morse Code trainer.',
  theme_color: '#0b0d10',
  background_color: '#0b0d10',
  display: 'standalone',
  start_url: PWA_BASE,
  scope: PWA_BASE,
  icons: [
    {
      src: 'pwa-64x64.png',
      sizes: '64x64',
      type: 'image/png',
    },
    {
      src: 'pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: 'pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: 'maskable-icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
} satisfies Partial<ManifestOptions>
