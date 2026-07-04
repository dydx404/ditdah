import { describe, expect, it } from 'vitest'
import { PWA_BASE, PWA_INCLUDE_ASSETS, PWA_MANIFEST } from './pwa'

describe('PWA manifest config', () => {
  it('is scoped to the GitHub Pages base path', () => {
    expect(PWA_BASE).toBe('/ditdah/')
    expect(PWA_MANIFEST.start_url).toBe('/ditdah/')
    expect(PWA_MANIFEST.scope).toBe('/ditdah/')
  })

  it('includes installable and maskable icons', () => {
    expect(PWA_MANIFEST.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: 'pwa-192x192.png', sizes: '192x192' }),
        expect.objectContaining({ src: 'pwa-512x512.png', sizes: '512x512' }),
        expect.objectContaining({
          src: 'maskable-icon-512x512.png',
          purpose: 'maskable',
        }),
      ]),
    )
  })

  it('precache hints include the source icon and platform icons', () => {
    expect(PWA_INCLUDE_ASSETS).toEqual(
      expect.arrayContaining([
        'favicon.ico',
        'icon.svg',
        'apple-touch-icon-180x180.png',
      ]),
    )
  })
})
