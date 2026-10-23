'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { renderAvatar } from '@/lib/avatar'
import { useTrainer, useUser, useWardrobe } from '@/lib/client'
import { ABILITIES, rushKitFor, type AbilityId, type RushKit } from '@/lib/game'

/* Blitz Rush: a three-lane race against three rivals. Swipe or tap a side to change lanes and dodge barriers; a crash
   kills your speed. The fastest rival is out of reach on skill alone. Wearables unlock the moves that win:
   Blitz Boost (Blitz Jacket), Fly (Circuit Wings), Slash (Plasma Blade), a Shield (Hero Cape). Rules in lib/game.ts. */

const W = 360
const H = 640
const ROAD_L = 36
const ROAD_R = 324
const LANES = [84, 180, 276]
const PLAYER_Y = 500
const TRACK = 15000
const BASE_TOP = 400
const ACCEL = 260
const BOOST_SPEED = 780
const CRASH_SPEED = 110
const RIVALS = [
  { name: 'Volt', speed: 335, color: '#5EC8FF', lane: 0 },
  { name: 'Nova', speed: 366, color: '#FF8AD8', lane: 2 },
  { name: 'Rex', speed: 404, color: '#FBBF24', lane: 1 },
]

type Phase = 'ready' | 'playing' | 'over'
type Hud = { place: number; progress: number; rivals: number[]; cooldowns: Record<string, number>; shields: number; boosting: boolean }

export default function RushPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const wardrobe = useWardrobe(user)
  const partner = Number(trainer.profile?.partner ?? 0n)
  const gearKey = wardrobe.equipped.join(',')
  const gear = useMemo(() => (gearKey ? gearKey.split(',').map(Number) : []), [gearKey])
  const kit = useMemo(() => rushKitFor(gear, partner), [gear, partner])
  const ready = !wardrobe.loading && !trainer.loading

  const [phase, setPhase] = useState<Phase>('ready')
  const [hud, setHud] = useState<Hud>({ place: 4, progress: 0, rivals: [0, 0, 0], cooldowns: {}, shields: kit.shields, boosting: false })
  const [result, setResult] = useState<{ place: number; time: number } | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const bestKey = `socemon:rush:best:${user}`
  const canvas = useRef<HTMLCanvasElement>(null)
  const controls = useRef({ start: () => {}, steer: (_dir: number) => {}, use: (_id: AbilityId) => {} })
  const touch = useRef<number | null>(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem(bestKey)
      if (v) setBest(Number(v))
    } catch {}
  }, [bestKey])

  useEffect(() => {
    if (!ready || !canvas.current) return
    return startRace(canvas.current, gear, kit, {
      onPhase: setPhase,
      onHud: setHud,
      onFinish: (r) => {
        setResult(r)
        setBest((b) => {
          const next = b === null ? r.time : Math.min(b, r.time)
          try {
            localStorage.setItem(bestKey, String(next))
          } catch {}
          return next
        })
      },
      bind: (c) => (controls.current = c),
    })
  }, [ready, gear, kit, bestKey])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = controls.current
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') c.steer(-1)
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') c.steer(1)
      else if (e.code === 'Space') c.use('boost')
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') c.use('fly')
      else if (e.code === 'KeyS') c.use('slash')
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* a tap on either half steers, a horizontal swipe steers too */
  function onPointerDown(e: React.PointerEvent) {
    touch.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    if (phase !== 'playing') return
    const start = touch.current ?? e.clientX
    const dx = e.clientX - start
    const rect = e.currentTarget.getBoundingClientRect()
    if (Math.abs(dx) > 24) controls.current.steer(dx > 0 ? 1 : -1)
    else controls.current.steer(e.clientX - rect.left < rect.width / 2 ? -1 : 1)
  }

  const missingBoost = !kit.abilities.some((a) => a.id === 'boost')

  return (
    <div className="fixed inset-0 z-50 bg-[#07070B] flex items-center justify-center select-none touch-none">
      <div className="relative h-full max-h-[100dvh] aspect-[9/16] max-w-full" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <canvas ref={canvas} className="w-full h-full block" aria-label="Blitz Rush race. Tap or swipe left and right to change lanes." />

        <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between pointer-events-none">
          <div>
            {phase === 'playing' && (
              <p className="font-poster text-[54px] leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.5)]">
                P{hud.place}<span className="text-[22px] text-white/60">/4</span>
              </p>
            )}
            {kit.shields > 0 && phase === 'playing' && (
              <p className="flex items-center gap-1 font-sans text-[12px] font-black text-white/80 mt-1">
                <Shield className={hud.shields ? 'w-4 h-4 text-[#5EE6B8]' : 'w-4 h-4 text-white/25'} /> Shield
              </p>
            )}
          </div>
          <Link
            href="/app/game"
            aria-label="Quit race"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </Link>
        </div>

        {phase === 'playing' && (
          <>
            <Progress progress={hud.progress} rivals={hud.rivals} />
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3 px-4">
              {kit.abilities.map((a) => {
                const left = hud.cooldowns[a.id] ?? 0
                return (
                  <button
                    key={a.id}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => {
                      e.stopPropagation()
                      controls.current.use(a.id)
                    }}
                    disabled={left > 0}
                    className="relative w-[74px] h-[74px] rounded-[22px] overflow-hidden border-2 border-white/30 bg-[#1B1250]/80 text-white font-sans text-[10px] font-black uppercase tracking-[0.04em] disabled:opacity-80"
                    style={a.id === 'boost' && hud.boosting ? { boxShadow: '0 0 24px #5EC8FF' } : undefined}
                  >
                    <span className="absolute inset-x-0 bottom-0 bg-white/15" style={{ height: `${(left / a.cooldown) * 100}%` }} />
                    <span className="relative block text-[26px] leading-none">{ICON[a.id]}</span>
                    <span className="relative block mt-1">{left > 0 ? Math.ceil(left) : a.name}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {phase === 'ready' && (
          <Overlay>
            <p className="eyebrow !text-white/60">Socemon Games</p>
            <h1 className="font-poster text-[56px] uppercase leading-none text-white">Blitz Rush</h1>
            <p className="font-sans text-[13px] font-bold text-white/70 max-w-[280px]">Beat Volt, Nova and Rex to the line. Tap or swipe to change lanes.</p>
            <Kit kit={kit} />
            <div onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
              <Button onClick={() => controls.current.start()} disabled={!ready}>{ready ? 'Race' : 'Loading your NFTs…'}</Button>
            </div>
          </Overlay>
        )}

        {phase === 'over' && result && (
          <Overlay>
            <p className="eyebrow !text-white/60">{result.place === 1 ? 'Winner' : 'Finished'}</p>
            <p className="font-poster text-[80px] leading-none text-white">{['1st', '2nd', '3rd', '4th'][result.place - 1]}</p>
            <p className="font-sans text-[14px] font-bold text-white/70">
              {result.time.toFixed(2)}s{best !== null && ` · best ${best.toFixed(2)}s`}
            </p>
            <div onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} className="flex flex-col items-center gap-3 mt-2">
              <Button onClick={() => controls.current.start()}>Race again</Button>
              <Link href="/app/wardrobe" className="font-sans text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#A99BFF]">Change gear</Link>
            </div>
            {missingBoost && (
              <p className="font-sans text-[13px] font-bold text-white/70 max-w-[280px] mt-2">
                ⚡ Rex is hard to catch. The Blitz Jacket from the Monad Blitz check-in unlocks Blitz Boost.
              </p>
            )}
          </Overlay>
        )}
      </div>
    </div>
  )
}

const ICON: Record<AbilityId, string> = { boost: '⚡', fly: '🪽', slash: '🗡️' }

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center bg-black/55 backdrop-blur-[2px]">
      {children}
    </div>
  )
}

function Kit({ kit }: { kit: RushKit }) {
  return (
    <div className="w-full max-w-[290px] rounded-[20px] bg-white/8 border border-white/10 p-3 text-left my-2 space-y-2">
      {ABILITIES.map((a) => {
        const on = kit.abilities.includes(a)
        return (
          <div key={a.id} className={`flex items-center gap-3 ${on ? '' : 'opacity-40'}`}>
            <span className="text-[22px] w-7 text-center">{on ? ICON[a.id] : '🔒'}</span>
            <div className="min-w-0">
              <p className="font-sans text-[13px] font-black text-white">{a.name}</p>
              <p className="font-sans text-[11px] font-bold text-white/60">{on ? a.text : `Wear the ${NAMES[a.from]} to unlock`}</p>
            </div>
          </div>
        )
      })}
      {kit.sources.filter((s) => !ABILITIES.some((a) => a.name === s.text)).map((s) => (
        <p key={s.name} className="flex justify-between gap-2 font-sans text-[11px] font-bold">
          <span className="text-white truncate">{s.name}</span>
          <span className="text-[#5EE6B8] shrink-0">{s.text}</span>
        </p>
      ))}
    </div>
  )
}

const NAMES: Record<number, string> = { 190: 'Blitz Jacket', 181: 'Circuit Wings', 171: 'Plasma Blade' }

function Progress({ progress, rivals }: { progress: number; rivals: number[] }) {
  return (
    <div className="absolute right-3 top-24 bottom-28 w-2 rounded-full bg-white/15 pointer-events-none" aria-hidden>
      {rivals.map((r, i) => (
        <span key={i} className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-black/40"
          style={{ bottom: `${r * 100}%`, background: RIVALS[i].color }} />
      ))}
      <span className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#836EF9]" style={{ bottom: `${progress * 100}%` }} />
    </div>
  )
}

type Barrier = { d: number; lane: number; broken: boolean }

/** One race on the canvas, restartable, until unmount. React hears about the HUD at about 10 frames a second. */
function startRace(
  el: HTMLCanvasElement,
  equipped: number[],
  kit: RushKit,
  on: {
    onPhase: (p: Phase) => void
    onHud: (h: Hud) => void
    onFinish: (r: { place: number; time: number }) => void
    bind: (c: { start: () => void; steer: (dir: number) => void; use: (id: AbilityId) => void }) => void
  },
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = W * dpr
  el.height = H * dpr
  const ctx = el.getContext('2d')!
  ctx.scale(dpr, dpr)

  const sprite = new Image()
  sprite.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderAvatar(equipped, undefined, true))}`
  const top = BASE_TOP * (1 + kit.topSpeed)

  let phase: Phase = 'ready'
  let d = 0
  let v = 0
  let lane = 1
  let x = LANES[1]
  let time = 0
  let shields = kit.shields
  let stun = 0
  let barriers: Barrier[] = []
  let rivals = RIVALS.map(() => ({ d: 0, done: 0 }))
  let finished: number[] = [] // rival finish order
  const active: Record<string, number> = {}
  const cooldown: Record<string, number> = {}
  let sparks: { x: number; y: number; t: number }[] = []
  let slashFx = 0
  let hudAt = 0
  let last = performance.now()
  let raf = 0

  function layTrack() {
    barriers = []
    for (let at = 700; at < TRACK - 300; at += 240 + Math.random() * 160) {
      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.35 ? 2 : 1)
      for (const l of lanes) barriers.push({ d: at, lane: l, broken: false })
    }
  }

  function reset() {
    d = 0
    v = 0
    lane = 1
    x = LANES[1]
    time = 0
    shields = kit.shields
    stun = 0
    rivals = RIVALS.map(() => ({ d: 0, done: 0 }))
    finished = []
    for (const k of Object.keys(active)) delete active[k]
    for (const k of Object.keys(cooldown)) delete cooldown[k]
    sparks = []
    layTrack()
  }
  layTrack()

  on.bind({
    start: () => {
      reset()
      phase = 'playing'
      on.onPhase(phase)
    },
    steer: (dir) => {
      if (phase === 'playing') lane = Math.max(0, Math.min(2, lane + dir))
    },
    use: (id) => {
      const a = kit.abilities.find((k) => k.id === id)
      if (!a || phase !== 'playing' || (cooldown[id] ?? 0) > 0) return
      active[id] = a.duration
      cooldown[id] = a.cooldown
      if (id === 'boost') stun = 0
      if (id === 'slash') {
        const target = barriers.find((b) => !b.broken && b.lane === lane && b.d > d && b.d - d < 320)
        if (target) {
          target.broken = true
          sparks.push({ x: LANES[target.lane], y: PLAYER_Y - (target.d - d), t: 0.4 })
        }
        slashFx = 0.25
      }
    },
  })

  function place() {
    const ahead = rivals.filter((r) => r.d > d).length
    return Math.min(4, 1 + ahead)
  }

  function update(dt: number) {
    if (phase !== 'playing') return
    time += dt
    for (const k of Object.keys(active)) active[k] = Math.max(0, active[k] - dt)
    for (const k of Object.keys(cooldown)) cooldown[k] = Math.max(0, cooldown[k] - dt)
    slashFx = Math.max(0, slashFx - dt)
    stun = Math.max(0, stun - dt)

    const boosting = (active.boost ?? 0) > 0
    const flying = (active.fly ?? 0) > 0
    if (boosting) v = BOOST_SPEED
    else if (v > top) v = Math.max(top, v - 500 * dt)
    else if (stun <= 0) v = Math.min(top, v + ACCEL * dt)
    d += v * dt
    x += (LANES[lane] - x) * Math.min(1, dt * 14)

    rivals.forEach((r, i) => {
      if (r.d >= TRACK) return
      const wobble = 1 + Math.sin(time * (0.7 + i * 0.3) + i) * 0.04
      r.d += RIVALS[i].speed * wobble * Math.min(1, time / 2) * dt
      if (r.d >= TRACK) finished.push(i)
    })

    for (const b of barriers) {
      if (b.broken || Math.abs(b.d - d) > 26 || Math.abs(x - LANES[b.lane]) > 52) continue
      if (flying) continue
      b.broken = true
      sparks.push({ x: LANES[b.lane], y: PLAYER_Y, t: 0.4 })
      if (boosting) continue
      if (shields > 0) {
        shields--
        continue
      }
      v = CRASH_SPEED
      stun = 0.6
    }
    sparks = sparks.filter((s) => (s.t -= dt) > 0)

    if (d >= TRACK) {
      phase = 'over'
      on.onPhase(phase)
      on.onFinish({ place: 1 + finished.length, time })
    }

    const now = performance.now()
    if (now - hudAt > 100) {
      hudAt = now
      on.onHud({
        place: place(),
        progress: Math.min(1, d / TRACK),
        rivals: rivals.map((r) => Math.min(1, r.d / TRACK)),
        cooldowns: { ...cooldown },
        shields,
        boosting,
      })
    }
  }

  function draw() {
    ctx.fillStyle = '#0B0820'
    ctx.fillRect(0, 0, W, H)
    const boosting = (active.boost ?? 0) > 0
    const flying = (active.fly ?? 0) > 0

    // road and the Blitz iridescent rails
    ctx.fillStyle = '#16113A'
    ctx.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H)
    const rail = ctx.createLinearGradient(0, 0, 0, H)
    rail.addColorStop(0, '#836EF9')
    rail.addColorStop(0.5, '#5EC8FF')
    rail.addColorStop(1, '#FF8AD8')
    ctx.fillStyle = rail
    ctx.fillRect(ROAD_L - 6, 0, 6, H)
    ctx.fillRect(ROAD_R, 0, 6, H)
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    const dash = d % 60
    for (const lx of [132, 228]) for (let y = -60 + dash; y < H; y += 60) ctx.fillRect(lx - 2, y, 4, 30)

    // side scenery streaks, faster when boosting
    ctx.fillStyle = boosting ? 'rgba(94,200,255,0.6)' : 'rgba(131,110,249,0.35)'
    for (let i = 0; i < 8; i++) {
      const y = ((i * 97 + d * (boosting ? 1.6 : 1)) % (H + 80)) - 40
      ctx.fillRect(10, y, 3, boosting ? 60 : 24)
      ctx.fillRect(W - 13, (y + 300) % H, 3, boosting ? 60 : 24)
    }

    // finish line
    const fy = PLAYER_Y - (TRACK - d)
    if (fy > -40 && fy < H) {
      for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#fff' : '#111'
        ctx.fillRect(ROAD_L + i * 24, fy + j * 12, 24, 12)
      }
    }

    for (const b of barriers) {
      if (b.broken) continue
      const y = PLAYER_Y - (b.d - d)
      if (y < -40 || y > H + 40) continue
      ctx.save()
      ctx.shadowColor = '#FF3D7F'
      ctx.shadowBlur = 12
      ctx.fillStyle = '#FF3D7F'
      roundRect(LANES[b.lane] - 38, y - 13, 76, 26, 8)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#1B1250'
      for (let s = 0; s < 4; s++) ctx.fillRect(LANES[b.lane] - 30 + s * 18, y - 13, 8, 26)
    }

    RIVALS.forEach((r, i) => {
      const y = PLAYER_Y - (rivals[i].d - d)
      if (y < -60 || y > H + 60) return
      drawCar(LANES[r.lane], y, r.color)
    })

    for (const s of sparks) {
      ctx.fillStyle = `rgba(255,255,255,${s.t * 2})`
      for (let k = 0; k < 6; k++) ctx.fillRect(s.x + Math.cos(k) * (1 - s.t) * 60, s.y + Math.sin(k * 2) * (1 - s.t) * 40, 4, 4)
    }

    if (boosting) {
      // lightning trail
      ctx.strokeStyle = '#E9FFFF'
      ctx.lineWidth = 3
      ctx.shadowColor = '#5EC8FF'
      ctx.shadowBlur = 16
      for (const off of [-14, 14]) {
        ctx.beginPath()
        let ly = PLAYER_Y + 20
        ctx.moveTo(x + off, ly)
        while (ly < H) {
          ly += 18
          ctx.lineTo(x + off + (Math.random() - 0.5) * 18, ly)
        }
        ctx.stroke()
      }
      ctx.shadowBlur = 0
    }

    const lift = flying ? 1.3 : 1
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.ellipse(x + (flying ? 16 : 0), PLAYER_Y + 30 + (flying ? 14 : 0), 30, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate(x, PLAYER_Y - (flying ? 18 : 0))
    ctx.scale(lift, lift)
    // hoverboard
    ctx.fillStyle = boosting ? '#5EC8FF' : '#836EF9'
    ctx.shadowColor = boosting ? '#5EC8FF' : '#836EF9'
    ctx.shadowBlur = 18
    roundRect(-30, 18, 60, 14, 7)
    ctx.fill()
    ctx.shadowBlur = 0
    if (stun > 0 && Math.floor(stun * 20) % 2) ctx.globalAlpha = 0.4
    if (sprite.complete) ctx.drawImage(sprite, 30, 10, 340, 340, -36, -46, 72, 72)
    ctx.restore()

    if (slashFx > 0) {
      ctx.strokeStyle = `rgba(45,226,230,${slashFx * 4})`
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(x - 40, PLAYER_Y - 60)
      ctx.lineTo(x + 40, PLAYER_Y - 200)
      ctx.stroke()
    }
  }

  function drawCar(cx: number, cy: number, color: string) {
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 14
    ctx.fillStyle = color
    roundRect(cx - 20, cy - 30, 40, 60, 12)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    roundRect(cx - 13, cy - 16, 26, 18, 5)
    ctx.fill()
    ctx.restore()
  }

  function roundRect(rx: number, ry: number, rw: number, rh: number, r: number) {
    ctx.beginPath()
    ctx.roundRect(rx, ry, rw, rh, r)
  }

  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    update(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}
