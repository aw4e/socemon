'use client'
import { useState } from 'react'
import { imageFor, speciesById } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* A Socemon portrait. `silhouette` gives the Socédex "not caught yet" look with a CSS filter (needs the transparent PNGs).
   A missing file falls back to the name so an unfinished art set never shows a broken image. */
export function MonsterImage({ id, size = 96, silhouette = false, className }: {
  id: number
  size?: number
  silhouette?: boolean
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const name = speciesById(id)?.name ?? 'Socemon'

  if (broken) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-2xl bg-[var(--fill)] font-sans text-[11px] text-text-tertiary text-center', className)}
        style={{ width: size, height: size }}
      >
        {silhouette ? '???' : name}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageFor(id)}
      alt={silhouette ? 'Not caught yet' : name}
      width={size}
      height={size}
      draggable={false}
      onError={() => setBroken(true)}
      className={cn('object-contain select-none', silhouette && 'brightness-0 opacity-20', className)}
    />
  )
}
