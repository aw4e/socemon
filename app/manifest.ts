import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Socemon',
    short_name: 'Socemon',
    description: 'Social on Monad. Catch your network.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F7',
    theme_color: '#6A4DF4',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
