'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { PerkList } from '@/components/game/PerkList'
import { Button } from '@/components/ui/Button'
import { renderAvatar } from '@/lib/avatar'
import { useTrainer, useUser, useWardrobe } from '@/lib/client'
import { perksFor, type Perks } from '@/lib/game'
import { imageFor, isDropWearable } from '@/lib/socemon'

/* Blitz Flap: tap to fly your own avatar through the pipes. Your NFTs are the strategy: wearables add lives, a wider
   gap or slow-mo, and your pet multiplies the score (rules in lib/game.ts). */

const W = 360
const H = 640
const GROUND = 70
const GRAVITY = 1400
const FLAP = -430
const PIPE_W = 64
const BASE_GAP = 165
const BASE_SPEED = 170
const SPACING = 215
const BIRD_X = 96
const SPRITE = 84 // the 340px avatar crop drawn at this size
const HIT_W = 28
const HIT_H = 54

type Phase = 'ready' | 'playing' | 'over'
type Pipe = { x: number; gapY: number; passed: boolean }

export default function FlapPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const wardrobe = useWardrobe(user)
  const partner = Number(trainer.profile?.partner ?? 0n)
  /* useWardrobe hands back a new array every render; a string key keeps the game from restarting on each one */
  const gearKey = wardrobe.equipped.join(',')
  const gear = useMemo(() => (gearKey ? gearKey.split(',').map(Number) : []), [gearKey])
  const perks = useMemo(() => perksFor(gear, partner), [gear, partner])
  const ready = !wardrobe.loading && !trainer.loading

  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(perks.lives)
  const [best, setBest] = useState(0)
  const bestKey = `socemon:flap:best:${user}`
  const canvas = useRef<HTMLCanvasElement>(null)
  const flap = useRef<() => void>(() => {})

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(bestKey) ?? 0))
    } catch {}
  }, [bestKey])

  useEffect(() => {
    if (!ready || !canvas.current) return
    return startGame(canvas.current, gear, partner, perks, {
      onPhase: setPhase,
      onScore: setScore,
      onLives: setLives,
      onOver: (final) =>
        setBest((b) => {
          const next = Math.max(b, final)
          try {
            localStorage.setItem(bestKey, String(next))
          } catch {}
          return next
        }),
      bindFlap: (fn) => (flap.current = fn),
    })
  }, [ready, gear, partner, perks, bestKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        flap.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-[#07070B] flex items-center justify-center select-none touch-none">
      <div className="relative h-full max-h-[100dvh] aspect-[9/16] max-w-full" onPointerDown={() => flap.current()}>
        <canvas ref={canvas} className="w-full h-full block" aria-label="Blitz Flap game. Tap or press space to fly." />

        <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between pointer-events-none">
          <div className="flex gap-1" aria-label={`${lives} lives`}>
            {Array.from({ length: perks.lives }, (_, i) => (
              <Heart key={i} className={i < lives ? 'w-6 h-6 text-[#FF5C8A] fill-[#FF5C8A]' : 'w-6 h-6 text-white/25'} />
            ))}
          </div>
          <Link
            href="/app/game"
            aria-label="Quit game"
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </Link>
        </div>
        {phase === 'playing' && (
          <p className="absolute inset-x-0 top-16 text-center font-poster text-[64px] leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] pointer-events-none">
            {score}
          </p>
        )}

        {phase === 'ready' && (
          <Overlay>
            <p className="eyebrow !text-white/60">Socemon Games</p>
            <h1 className="font-poster text-[56px] uppercase leading-none text-white">Blitz Flap</h1>
            <PerkList perks={perks} />
            <p className="font-sans text-[16px] font-black text-white animate-pulse mt-2">{ready ? 'Tap to fly' : 'Loading your NFTs…'}</p>
          </Overlay>
        )}

        {phase === 'over' && (
          <Overlay>
            <p className="eyebrow !text-white/60">Game over</p>
            <p className="font-poster text-[72px] leading-none text-white">{score}</p>
            <p className="font-sans text-[14px] font-bold text-white/70">Best {Math.max(best, score)}</p>
            <div onPointerDown={(e) => e.stopPropagation()} className="flex flex-col gap-3 w-full max-w-[260px] mt-3">
              <Button onClick={() => flap.current()}>Play again</Button>
              <Link href="/app/wardrobe" className="font-sans text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#A99BFF]">
                Change gear
              </Link>
            </div>
            <p className="font-sans text-[13px] font-bold text-white/60 max-w-[280px] mt-2">
              More lives and a bigger multiplier come from NFTs: meet people for blind boxes, check in at events for drops.
            </p>
          </Overlay>
        )}
      </div>
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    /* sits in the lower half so the avatar hovering at mid-screen stays in view */
    <div className="absolute inset-x-0 bottom-0 top-[52%] flex flex-col items-center justify-start gap-2 px-8 pt-2 text-center bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
      {children}
    </div>
  )
}

/** Runs one game on the canvas until unmount. React only hears about phase, score and lives changes. */
function startGame(
  el: HTMLCanvasElement,
  equipped: number[],
  partner: number,
  perks: Perks,
  on: {
    onPhase: (p: Phase) => void
    onScore: (n: number) => void
    onLives: (n: number) => void
    onOver: (score: number) => void
    bindFlap: (fn: () => void) => void
  },
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = W * dpr
  el.height = H * dpr
  const ctx = el.getContext('2d')!
  ctx.scale(dpr, dpr)

  const sprite = new Image()
  sprite.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderAvatar(equipped, undefined, true))}`
  const pet = new Image()
  let petOk = false
  pet.onload = () => (petOk = true)
  if (!isDropWearable(partner)) pet.src = imageFor(partner)

  const stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * (H - GROUND), r: Math.random() * 1.6 + 0.3, z: Math.random() * 0.6 + 0.2 }))
  const gap = BASE_GAP + perks.gap

  let phase: Phase = 'ready'
  let y = H / 2 - 40
  let vy = 0
  let pipes: Pipe[] = []
  let points = 0
  let lives = perks.lives
  let invuln = 0
  let scroll = 0
  let trail: number[] = []
  let last = performance.now()
  let raf = 0
  let overAt = 0

  function reset() {
    y = H / 2 - 40
    vy = 0
    pipes = []
    points = 0
    lives = perks.lives
    invuln = 0
    trail = []
    on.onScore(0)
    on.onLives(lives)
  }

  on.bindFlap(() => {
    if (phase === 'over' && performance.now() - overAt < 700) return // a late tap should not restart at once
    if (phase !== 'playing') {
      reset()
      phase = 'playing'
      on.onPhase(phase)
    }
    vy = FLAP
  })

  function hit() {
    if (invuln > 0) return
    lives--
    on.onLives(lives)
    if (lives <= 0) {
      phase = 'over'
      overAt = performance.now()
      on.onPhase(phase)
      on.onOver(Math.floor(points))
      return
    }
    invuln = 1.5
    vy = FLAP
  }

  function update(dt: number) {
    const speed = BASE_SPEED * perks.speed * Math.min(1.5, 1 + points * 0.008)
    scroll += speed * dt
    if (phase !== 'playing') {
      y = H / 2 - 40 + Math.sin(performance.now() / 300) * 8
      return
    }
    vy = Math.min(vy + GRAVITY * dt, 620)
    y += vy * dt
    invuln = Math.max(0, invuln - dt)
    trail.unshift(y)
    trail = trail.slice(0, 14)

    if (!pipes.length || pipes[pipes.length - 1].x < W - SPACING) {
      pipes.push({ x: W + 10, gapY: 120 + Math.random() * (H - GROUND - 240 - gap / 2) + gap / 2 - 40, passed: false })
    }
    for (const p of pipes) {
      p.x -= speed * dt
      if (!p.passed && p.x + PIPE_W < BIRD_X - HIT_W / 2) {
        p.passed = true
        points += perks.multiplier
        on.onScore(Math.floor(points))
      }
    }
    pipes = pipes.filter((p) => p.x > -PIPE_W - 10)

    if (y < HIT_H / 2) {
      y = HIT_H / 2
      vy = 0
    }
    const top = y - HIT_H / 2
    const bottom = y + HIT_H / 2
    const left = BIRD_X - HIT_W / 2
    const right = BIRD_X + HIT_W / 2
    if (bottom >= H - GROUND) {
      y = H - GROUND - HIT_H / 2
      hit()
    }
    for (const p of pipes) {
      const inX = right > p.x && left < p.x + PIPE_W
      const inGap = top > p.gapY - gap / 2 && bottom < p.gapY + gap / 2
      if (inX && !inGap) {
        hit()
        if (phase === 'playing') p.x = -PIPE_W * 2 // that pipe breaks on the shield
        break
      }
    }
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#1B1250')
    sky.addColorStop(0.6, '#0D0A24')
    sky.addColorStop(1, '#07070B')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    for (const s of stars) {
      const x = (((s.x - scroll * s.z * 0.2) % W) + W) % W
      ctx.fillStyle = `rgba(255,255,255,${0.3 + s.z * 0.6})`
      ctx.beginPath()
      ctx.arc(x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    }

    // the Blitz poster's iridescent swoosh, drifting slowly
    const iris = ctx.createLinearGradient(0, 0, W, H)
    iris.addColorStop(0, 'rgba(131,110,249,0.55)')
    iris.addColorStop(0.5, 'rgba(94,200,255,0.4)')
    iris.addColorStop(1, 'rgba(255,138,216,0.45)')
    ctx.strokeStyle = iris
    ctx.lineWidth = 34
    const drift = (scroll * 0.05) % 60
    ctx.beginPath()
    ctx.moveTo(-60, 120 + drift)
    ctx.bezierCurveTo(W * 0.4, 40 + drift, W * 0.6, H * 0.55, W + 60, H * 0.45 + drift)
    ctx.stroke()

    for (const p of pipes) drawPipe(p.x, p.gapY)

    ctx.fillStyle = '#120D33'
    ctx.fillRect(0, H - GROUND, W, GROUND)
    ctx.strokeStyle = 'rgba(131,110,249,0.5)'
    ctx.lineWidth = 2
    for (let x = -(scroll % 30); x < W; x += 30) {
      ctx.beginPath()
      ctx.moveTo(x, H - GROUND)
      ctx.lineTo(x - 14, H)
      ctx.stroke()
    }
    ctx.fillStyle = '#836EF9'
    ctx.fillRect(0, H - GROUND, W, 4)

    if (petOk) {
      const py = trail[10] ?? y
      ctx.drawImage(pet, BIRD_X - 70, py - 4, 38, 38)
    }

    const blink = invuln > 0 && Math.floor(invuln * 10) % 2 === 0
    if (!blink && sprite.complete) {
      ctx.save()
      ctx.translate(BIRD_X, y)
      ctx.rotate(Math.max(-0.45, Math.min(0.6, vy / 900)))
      // the avatar crop (x 30..370, y 10..350 of the 400 rig) keeps wings and capes in frame
      ctx.drawImage(sprite, 30, 10, 340, 340, -SPRITE / 2, -SPRITE / 2 + 4, SPRITE, SPRITE)
      ctx.restore()
    }
  }

  function drawPipe(x: number, gapY: number) {
    const body = ctx.createLinearGradient(x, 0, x + PIPE_W, 0)
    body.addColorStop(0, '#2A1F86')
    body.addColorStop(0.5, '#836EF9')
    body.addColorStop(1, '#2A1F86')
    ctx.save()
    ctx.shadowColor = 'rgba(131,110,249,0.7)'
    ctx.shadowBlur = 14
    ctx.fillStyle = body
    const topEnd = gapY - gap / 2
    const bottomStart = gapY + gap / 2
    ctx.fillRect(x, 0, PIPE_W, topEnd)
    ctx.fillRect(x, bottomStart, PIPE_W, H - GROUND - bottomStart)
    ctx.fillStyle = '#5EC8FF'
    ctx.fillRect(x - 6, topEnd - 18, PIPE_W + 12, 18)
    ctx.fillRect(x - 6, bottomStart, PIPE_W + 12, 18)
    ctx.restore()
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    update(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }
  on.onLives(lives)
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
