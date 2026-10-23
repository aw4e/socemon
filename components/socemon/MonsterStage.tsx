import { MonsterImage } from '@/components/socemon/MonsterImage'
import { colorOf, speciesById } from '@/lib/socemon'

/* A monster on its type-colored stage: its name as giant ghost poster type behind it, a soft glow, an idle float,
   and a contact shadow. `silhouette` hides who it is (event drops before you catch them). */
export function MonsterStage({ id, size = 200, ghost, silhouette = false, mark, raised = false }: {
  id: number
  size?: number
  ghost?: string
  silhouette?: boolean
  /** Sit the art in the upper-middle of the stage instead of on its floor, e.g. a wearable on a poster. */
  raised?: boolean
  /** A big mark over the middle of the silhouette, e.g. "?" for a mystery drop. */
  mark?: string
}) {
  const color = colorOf(id)
  const word = ghost ?? speciesById(id)?.name ?? ''
  return (
    <div className={`relative flex ${raised ? 'items-center' : 'items-end'} justify-center w-full`} style={{ height: size * 1.12 }}>
      <p
        aria-hidden
        className={`absolute inset-x-0 ${raised ? 'top-1/2' : 'top-[38%]'} -translate-y-1/2 text-center font-poster uppercase leading-none whitespace-nowrap select-none pointer-events-none`}
        style={{ fontSize: Math.min(size * 0.62, 150), color, opacity: 0.2, letterSpacing: '-0.01em' }}
      >
        {word}
      </p>
      <div aria-hidden className="absolute top-[14%] rounded-full blur-3xl" style={{ width: size * 0.8, height: size * 0.8, background: color, opacity: 0.3 }} />
      <div aria-hidden className="absolute bottom-1 rounded-[50%] bg-black/50 blur-md" style={{ width: size * 0.55, height: size * 0.07 }} />
      <div className="relative animate-float">
        <MonsterImage key={id} id={id} size={size} silhouette={silhouette} />
        {mark && (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center font-poster leading-none text-white/70 select-none" style={{ fontSize: size * 0.5 }}>
            {mark}
          </span>
        )}
      </div>
    </div>
  )
}
