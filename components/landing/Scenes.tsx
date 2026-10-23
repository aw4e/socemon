import { Heart, Zap } from 'lucide-react'

/* Live-looking miniatures of the ecosystem and both games, in CSS and SVG only (keyframes in globals.css). */

const IRIS = 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)'

/** Avatar art straight from the renderer: `wear` is one wearable id per slot. */
const avatar = (wear: number[]) => `/api/avatar/preview?wear=${wear.join(',')}&bare`
const BLITZ_RACER = avatar([0, 111, 0, 190, 140, 0, 161, 0, 0])
const WINGED = avatar([101, 110, 120, 131, 141, 0, 0, 0, 181])

/** The ecosystem as a loop: three parties on one ring, a spark that never stops going round. */
export function Loop() {
  const nodes = [
    { label: 'Community', sub: 'hosts', angle: -90, color: '#2DD4BF' },
    { label: 'Players', sub: 'show up', angle: 30, color: '#836EF9' },
    { label: 'Games', sub: 'sponsor', angle: 150, color: '#FBBF24' },
  ]
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto my-10">
      <svg viewBox="-200 -200 400 400" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="loop-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#836EF9" />
            <stop offset=".5" stopColor="#5EC8FF" />
            <stop offset="1" stopColor="#FF8AD8" />
          </linearGradient>
          <marker id="loop-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="#fff" />
          </marker>
        </defs>
        <circle r="140" fill="none" stroke="url(#loop-ring)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
        <circle r="140" fill="none" stroke="url(#loop-ring)" strokeWidth="26" opacity=".08" />
        {[-30, 90, 210].map((a) => (
          <path key={a} d={arc(a - 22, a + 22, 140)} fill="none" stroke="#fff" strokeWidth="2.5" markerEnd="url(#loop-arrow)" />
        ))}
        <g className="animate-orbit" style={{ transformOrigin: '0 0' }}>
          <circle cy="-140" r="7" fill="#fff" />
          <circle cy="-140" r="18" fill="#fff" opacity=".18" />
        </g>
        {nodes.map((n) => {
          const x = Math.cos((n.angle * Math.PI) / 180) * 140
          const y = Math.sin((n.angle * Math.PI) / 180) * 140
          return <circle key={n.label} cx={x} cy={y} r="13" fill={n.color} stroke="#0D0A1A" strokeWidth="5" />
        })}
      </svg>
      {nodes.map((n) => {
        /* labels sit just outside the ring: above the top node, below the two bottom ones */
        const x = 50 + Math.cos((n.angle * Math.PI) / 180) * 38
        const y = 50 + Math.sin((n.angle * Math.PI) / 180) * 35 + (n.angle === -90 ? -13 : 15)
        return (
          <p key={n.label} className="absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap" style={{ left: `${x}%`, top: `${y}%` }}>
            <span className="block font-poster uppercase leading-none text-[clamp(26px,4.4vw,46px)]" style={{ color: n.color }}>{n.label}</span>
            <span className="block font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-text-tertiary mt-1">{n.sub}</span>
          </p>
        )
      })}
      <p className="absolute inset-0 flex items-center justify-center font-poster uppercase text-[clamp(40px,7vw,72px)] leading-none bg-clip-text text-transparent" style={{ backgroundImage: IRIS }}>
        The loop
      </p>
    </div>
  )
}

function arc(from: number, to: number, r: number) {
  const p = (a: number) => `${Math.cos((a * Math.PI) / 180) * r} ${Math.sin((a * Math.PI) / 180) * r}`
  return `M ${p(from)} A ${r} ${r} 0 0 1 ${p(to)}`
}

/** A phone-sized window onto a game: no chrome, just the scene behind a hairline. */
function Viewport({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="relative aspect-[9/16] w-full max-w-[300px] mx-auto overflow-hidden rounded-[44px] ring-1 ring-white/15 shadow-[0_40px_120px_-20px_rgba(131,110,249,0.55)]">
      {children}
    </div>
  )
}

/** Blitz Rush: lanes rushing past, barriers falling, a Blitz Jacket racer boosting on a lightning trail. */
export function RushScene() {
  return (
    <Viewport label="Blitz Rush: an avatar in the Blitz Jacket boosts past barriers on a lightning trail">
      <div className="absolute inset-0 bg-[#16113A]" />
      <div className="absolute inset-y-0 left-[8%] w-[3px]" style={{ background: IRIS }} />
      <div className="absolute inset-y-0 right-[8%] w-[3px]" style={{ background: IRIS }} />
      {[36.6, 63.3].map((x) => (
        <div key={x} className="absolute inset-y-0 w-[3px] animate-lane" style={{ left: `${x}%`, backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.22) 50%, transparent 50%)', backgroundSize: '3px 60px' }} />
      ))}
      {[
        { left: '12%', delay: '0s' },
        { left: '66%', delay: '-0.8s' },
        { left: '12%', delay: '-1.5s' },
      ].map((b, i) => (
        <div key={i} className="absolute top-0 w-[22%] h-[4.5%] rounded-lg animate-drop shadow-[0_0_18px_#FF3D7F]"
          style={{ left: b.left, animationDelay: b.delay, background: 'repeating-linear-gradient(90deg, #FF3D7F 0 10px, #1B1250 10px 16px)' }} />
      ))}
      <div className="absolute left-[43%] top-[14%] w-[14%] h-[11%] rounded-xl bg-[#FBBF24] shadow-[0_0_20px_#FBBF24] opacity-80" />
      <svg viewBox="0 0 60 200" className="absolute left-1/2 -translate-x-1/2 top-[74%] w-[22%] animate-zap" aria-hidden>
        <polyline points="20,0 12,30 26,55 10,85 24,115 12,150 22,200" fill="none" stroke="#E9FFFF" strokeWidth="4" />
        <polyline points="40,0 48,30 34,55 50,85 36,115 48,150 38,200" fill="none" stroke="#5EC8FF" strokeWidth="4" />
      </svg>
      <div className="absolute left-1/2 -translate-x-1/2 top-[71%] w-[28%] h-[3%] rounded-full bg-[#5EC8FF] shadow-[0_0_30px_#5EC8FF]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BLITZ_RACER} alt="" className="absolute left-1/2 -translate-x-1/2 top-[50%] w-[34%]" />
      <p className="absolute left-5 top-5 font-poster text-[44px] leading-none text-white">P1<span className="text-[18px] text-white/50">/4</span></p>
      <p className="absolute right-4 bottom-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 ring-2 ring-[#5EC8FF] shadow-[0_0_24px_#5EC8FF]"><Zap className="w-7 h-7 text-[#E9FFFF] fill-[#5EC8FF]" /></p>
    </Viewport>
  )
}

/** Blitz Flap: a winged avatar bobbing through an endless row of neon pipes. */
export function FlapScene() {
  const pipes = [38, 58, 30, 52, 42, 60]
  return (
    <Viewport label="Blitz Flap: a winged avatar flies between neon pipes">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1B1250 0%, #0D0A24 60%, #07070B 100%)' }} />
      <div className="absolute -left-10 right-[-30%] top-[28%] h-10 rotate-[18deg] rounded-full opacity-50 blur-[2px]" style={{ background: IRIS }} />
      <div className="absolute inset-y-0 left-0 flex w-[400%] animate-pipes">
        {[...pipes, ...pipes].map((gap, i) => (
          <div key={i} className="relative h-full flex-1">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[38%] rounded-b-md" style={{ height: `${gap - 14}%`, background: 'linear-gradient(90deg, #2A1F86, #836EF9, #2A1F86)', boxShadow: '0 0 18px rgba(131,110,249,0.7)' }} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[11%] w-[38%] rounded-t-md" style={{ top: `${gap + 14}%`, background: 'linear-gradient(90deg, #2A1F86, #836EF9, #2A1F86)', boxShadow: '0 0 18px rgba(131,110,249,0.7)' }} />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[11%] bg-[#120D33] border-t-4 border-[#836EF9]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={WINGED} alt="" className="absolute left-[10%] top-[38%] w-[42%] animate-bob" />
      <p className="absolute inset-x-0 top-[8%] text-center font-poster text-[64px] leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">27</p>
      <p className="absolute left-5 top-5 flex gap-1">{[0, 1, 2].map((i) => <Heart key={i} className="w-5 h-5 text-[#FF5C8A] fill-[#FF5C8A]" />)}</p>
    </Viewport>
  )
}
