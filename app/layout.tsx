import type { Metadata, Viewport } from 'next'
import { Outfit, Playfair_Display, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { MotionProvider } from '@/components/providers/MotionProvider'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], style: 'italic', weight: ['500'], variable: '--font-playfair', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const tagline = 'Social on Monad. Catch your network.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Socemon', template: '%s · Socemon' },
  description: tagline,
  applicationName: 'Socemon',
  openGraph: { type: 'website', siteName: 'Socemon', title: 'Socemon', description: tagline },
  twitter: { card: 'summary_large_image', title: 'Socemon', description: tagline },
  appleWebApp: { capable: true, title: 'Socemon', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0E10' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} ${geistMono.variable}`}>
      <body className="font-sans text-text-primary antialiased">
        <Web3Provider>
          <MotionProvider>{children}</MotionProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
