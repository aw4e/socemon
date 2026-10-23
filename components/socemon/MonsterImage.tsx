'use client'
import { useState } from 'react'
import { colorOf, imageFor, isDropWearable, speciesById } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* A Socemon portrait. `silhouette` gives the Socédex "not caught yet" look with a CSS filter (needs the transparent PNGs).
   A missing file falls back to a round token with the name (or "?"), so an unfinished art set never shows a broken image. */
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
        className={cn('flex items-center justify-center rounded-full font-poster uppercase text-center leading-none px-2', className)}
        style={{
          width: size,
          height: size,
          fontSize: silhouette ? size * 0.42 : Math.max(11, size * 0.17),
          background: silhouette ? 'var(--fill)' : colorOf(id),
          color: silhouette ? 'var(--text-3)' : '#0D0A1A',
          boxShadow: silhouette ? undefined : 'inset 0 -6px 0 rgba(0, 0, 0, 0.18)',
        }}
      >
        {silhouette ? '?' : name}
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
