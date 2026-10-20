const EGG = 'M32 3C17 3 5 30 5 49c0 16.5 12 29 27 29s27-12.5 27-29C59 30 47 3 32 3z'

/* An Egg in its type color with speckles and a highlight. `ghost` draws an empty dashed outline for "no Eggs yet". */
export function EggShape({ color, size = 56, ghost = false }: { color: string; size?: number; ghost?: boolean }) {
  return (
    <svg viewBox="0 0 64 82" width={size} height={size * 1.28} aria-hidden>
      {ghost ? (
        <path d={EGG} fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.35" />
      ) : (
        <>
          <path d={EGG} fill={color} />
          <path d="M59 49c0 16.5-12 29-27 29-9 0-17-4.5-22-11.5 4 3 9 4.5 14.5 4.5C40 71 53 58 53 41c0-5-1-10.5-2.8-15.8C56 32 59 41 59 49z" fill="#000" opacity="0.14" />
          <circle cx="22" cy="40" r="4.5" fill="#fff" opacity="0.35" />
          <circle cx="40" cy="54" r="6.5" fill="#fff" opacity="0.25" />
          <circle cx="27" cy="63" r="3" fill="#fff" opacity="0.3" />
          <circle cx="42" cy="32" r="2.5" fill="#fff" opacity="0.3" />
          <ellipse cx="21" cy="24" rx="5" ry="9" transform="rotate(-24 21 24)" fill="#fff" opacity="0.45" />
        </>
      )}
    </svg>
  )
}
