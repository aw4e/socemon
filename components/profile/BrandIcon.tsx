import { ArrowUpRight, Globe, Mail } from 'lucide-react'
import { siDiscord, siFacebook, siGithub, siInstagram, siTelegram, siTiktok, siWhatsapp, siX, siYoutube } from 'simple-icons'
import type { Platform } from '@/lib/profile-page'

/* Brand marks for the link buttons: official paths from simple-icons, drawn in the colour of the surrounding text.
   simple-icons dropped LinkedIn, so its mark is written out here. */
const LINKEDIN =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'

const PATHS: Partial<Record<Platform, string>> = {
  twitter: siX.path, instagram: siInstagram.path, linkedin: LINKEDIN, github: siGithub.path, telegram: siTelegram.path,
  discord: siDiscord.path, whatsapp: siWhatsapp.path, youtube: siYoutube.path, tiktok: siTiktok.path, facebook: siFacebook.path,
}

export function BrandIcon({ platform, className }: { platform: Platform; className?: string }) {
  const path = PATHS[platform]
  if (path) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d={path} />
      </svg>
    )
  }
  if (platform === 'email') return <Mail className={className} strokeWidth={2} aria-hidden />
  if (platform === 'website') return <Globe className={className} strokeWidth={2} aria-hidden />
  return <ArrowUpRight className={className} strokeWidth={2.2} aria-hidden />
}
