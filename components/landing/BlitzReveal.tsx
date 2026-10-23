'use client'
import { useEffect, useRef } from 'react'
import { previewImage } from '@/lib/avatar'

/*
  The Blitz Jacket drop as a hover reveal (adapted from the MotionSites "Good Fox" prompt). The front scene is a bare
  avatar on Monad purple behind giant BLITZ / JACKET type. Dragging across it opens a soft, glowing hole onto its twin,
  the same avatar suited up in the jacket on the event's ink-and-iridescent night. Both avatars come from the same rig,
  so they line up pixel for pixel. The letters burst into pixels where the pointer passes and rebuild themselves.
*/

const FRONT_BG = '#836EF9'
const BACK_BG = '#0B0820'
const WORDS = ['BLITZ', 'JACKET']
const FRONT_SRC = previewImage([0, 110, 0, 0, 142, 0, 0, 0, 0])
const BACK_SRC = previewImage([0, 110, 0, 190, 142, 0, 161, 0, 0])

export function BlitzReveal({ children }: { children?: React.ReactNode }) {
  const hero = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLCanvasElement>(null)
  const font = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = hero.current!
    const canvas = view.current!
    const ctx = canvas.getContext('2d')!
    const family = getComputedStyle(font.current!).fontFamily
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const load = (src: string) => new Promise<HTMLImageElement>((ok, fail) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => ok(img)
      img.onerror = fail
      img.src = src
    })

    let front: HTMLImageElement, back: HTMLImageElement
    let w = 0, h = 0, dpr = 1, W = 0, H = 0
    let portrait = false
    let img = { x: 0, y: 0, s: 0 }
    let fs = 0
    const bufB = document.createElement('canvas')
    const textA = document.createElement('canvas')
    const textB = document.createElement('canvas')
    const staticA = document.createElement('canvas')
    const maskCanvas = document.createElement('canvas')
    const glowCanvas = document.createElement('canvas')
    let mw = 0, mh = 0
    let field = new Float32Array(0)
    let maskData: ImageData, glowData: ImageData
    let maskMax = 0

    // particles
    let n = 0, cs = 4
    let hx = new Float32Array(0), hy = hx, ox = hx, oy = hx, vx = hx, vy = hx, dd = hx, rr = hx
    let on = new Uint8Array(0)
    let box = { x0: 0, y0: 0, x1: 0, y1: 0 }
    let burstR = 0
    let slices: { y: number; h: number; x: number; w: number; shift: number; life: number }[] = []

    const pointer = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false, fresh: true }
    let lastStamp: { x: number; y: number } | null = null

    function wordMetrics(size: number) {
      ctx.font = `400 ${size}px ${family}`
      return WORDS.map((word) => ctx.measureText(word))
    }

    function resize() {
      w = el.clientWidth
      h = el.clientHeight
      if (!w || !h) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const budget = w < 760 ? 2.4e6 : 3.4e6
      if (w * h * dpr * dpr > budget) dpr = Math.sqrt(budget / (w * h))
      W = Math.round(w * dpr)
      H = Math.round(h * dpr)
      for (const c of [canvas, bufB, textA, textB, staticA]) {
        c.width = W
        c.height = H
      }
      portrait = h > w * 1.1

      const unit = wordMetrics(100)
      const widest = Math.max(...unit.map((m) => m.width)) / 100
      const sctx = staticA.getContext('2d')!
      sctx.clearRect(0, 0, W, H)
      sctx.fillStyle = '#fff'
      sctx.textBaseline = 'alphabetic'
      if (!portrait) {
        // the 400px avatar art keeps its figure in the middle 44%, so draw it big and bottom-anchored
        const s = Math.min(h * 1.04, w * 0.72)
        img = { x: (w - s) / 2, y: h - s * 0.93, s }
        const gap = s * 0.15
        fs = Math.min((w / 2 - gap - w * 0.04) / widest, h * 0.42)
        const cy = img.y + s * 0.27
        const m = wordMetrics(fs * dpr)
        sctx.font = `400 ${fs * dpr}px ${family}`
        sctx.textAlign = 'right'
        sctx.fillText(WORDS[0], (w / 2 - gap) * dpr, cy * dpr + (m[0].actualBoundingBoxAscent - m[0].actualBoundingBoxDescent) / 2)
        sctx.textAlign = 'left'
        sctx.fillText(WORDS[1], (w / 2 + gap) * dpr, cy * dpr + (m[1].actualBoundingBoxAscent - m[1].actualBoundingBoxDescent) / 2)
      } else {
        const s = Math.min(w * 1.45, h * 0.7)
        img = { x: (w - s) / 2, y: h - s * 0.93, s }
        fs = Math.min((w * 0.9) / widest, h * 0.16)
        const m = wordMetrics(fs * dpr)
        const cap = m[1].actualBoundingBoxAscent + m[1].actualBoundingBoxDescent
        const top = Math.max(90, h * 0.12) * dpr
        sctx.font = `400 ${fs * dpr}px ${family}`
        sctx.textAlign = 'center'
        sctx.fillText(WORDS[0], (w / 2) * dpr, top + cap)
        sctx.fillText(WORDS[1], (w / 2) * dpr, top + cap * 2.08)
      }

      // pixel particles sampled from the clean text
      cs = Math.max(3, Math.round((fs * dpr) / 46))
      const data = sctx.getImageData(0, 0, W, H).data
      const xs: number[] = [], ys: number[] = []
      for (let y = cs / 2; y < H; y += cs) {
        for (let x = cs / 2; x < W; x += cs) {
          if (data[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 110) {
            xs.push(x)
            ys.push(y)
          }
        }
      }
      n = xs.length
      hx = Float32Array.from(xs)
      hy = Float32Array.from(ys)
      ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n); dd = new Float32Array(n)
      rr = new Float32Array(n)
      on = new Uint8Array(n)
      let seed = 7
      for (let i = 0; i < n; i++) {
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        rr[i] = ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
      box = { x0: Math.min(...xs) - cs * 8, y0: Math.min(...ys) - cs * 4, x1: Math.max(...xs) + cs * 8, y1: Math.max(...ys) + cs * 4 }
      burstR = fs * dpr * (portrait ? 0.5 : 0.42)

      // the reveal mask, at a fifth of the CSS resolution and upscaled for soft edges
      mw = Math.ceil(w / 5)
      mh = Math.ceil(h / 5)
      field = new Float32Array(mw * mh)
      for (const c of [maskCanvas, glowCanvas]) {
        c.width = mw
        c.height = mh
      }
      maskData = new ImageData(mw, mh)
      glowData = new ImageData(mw, mh)
      for (const d of [maskData, glowData]) for (let i = 0; i < d.data.length; i += 4) d.data[i] = d.data[i + 1] = d.data[i + 2] = 255
      maskMax = 0
    }

    function stamp(x: number, y: number, r: number) {
      const fx = x / 5, fy = y / 5, fr = r / 5
      const x0 = Math.max(0, Math.floor(fx - fr)), x1 = Math.min(mw - 1, Math.ceil(fx + fr))
      const y0 = Math.max(0, Math.floor(fy - fr)), y1 = Math.min(mh - 1, Math.ceil(fy + fr))
      const k = fr * fr * 0.42
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const d2 = (xx - fx) ** 2 + (yy - fy) ** 2
          const g = Math.exp(-d2 / k)
          if (g < 0.01) continue
          const i = yy * mw + xx
          field[i] += g * 0.28 * (1.05 - field[i])
        }
      }
    }

    const smooth = (a: number, b: number, v: number) => {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }

    function updateMask(dt: number) {
      const speed = Math.hypot(pointer.vx, pointer.vy)
      if (pointer.active) {
        const r = Math.min(w, h) * (portrait ? 0.2 : 0.14) * (1 + (Math.min(speed, 40) / 40) * 0.55)
        const from = lastStamp ?? { x: pointer.x, y: pointer.y }
        const dist = Math.hypot(pointer.x - from.x, pointer.y - from.y)
        const steps = Math.min(40, Math.max(1, Math.ceil(dist / (r * 0.22))))
        for (let i = 1; i <= steps; i++) stamp(from.x + ((pointer.x - from.x) * i) / steps, from.y + ((pointer.y - from.y) * i) / steps, r)
        lastStamp = { x: pointer.x, y: pointer.y }
      } else lastStamp = null

      const k = dt * 60
      const keep = Math.pow(0.958, k)
      maskMax = 0
      for (let i = 0; i < field.length; i++) {
        const v = Math.max(0, field[i] * keep - 0.0035 * k)
        field[i] = v
        if (v > maskMax) maskMax = v
        maskData.data[i * 4 + 3] = smooth(0.1, 0.42, v) * 255
        glowData.data[i * 4 + 3] = smooth(0.02, 0.12, v) * (1 - smooth(0.12, 0.38, v)) * 230
      }
      maskCanvas.getContext('2d')!.putImageData(maskData, 0, 0)
      glowCanvas.getContext('2d')!.putImageData(glowData, 0, 0)
    }

    const active: number[] = []
    function updateParticles(dt: number) {
      const k = dt * 60
      const speed = Math.hypot(pointer.vx, pointer.vy)
      const moving = pointer.active && speed > 0.25
      const sp = Math.min(speed, 35) / 35
      const damp = Math.pow(0.9, k)
      const life = dt / 0.85
      const nvx = speed ? pointer.vx / speed : 0, nvy = speed ? pointer.vy / speed : 0
      const px = pointer.x * dpr, py = pointer.y * dpr
      if (moving) {
        const R = burstR
        for (let i = 0; i < n; i++) {
          const dx = hx[i] + ox[i] - px, dy = hy[i] + oy[i] - py
          if (Math.abs(dx) > R || Math.abs(dy) > R) continue
          const dist = Math.hypot(dx, dy) || 1
          if (dist > R) continue
          const f = 1 - dist / R
          dd[i] = Math.min(1, Math.max(dd[i], f * (0.9 + sp)))
          const imp = f * dpr * (0.35 + sp * 1.4)
          const turb = (rr[i] - 0.5) * 2
          vx[i] += (dx / dist) * imp * 2.2 + nvx * imp * 3.2 + imp * 0.8 + turb * imp * 2.4
          vy[i] += (dy / dist) * imp * 2.2 + nvy * imp * 3.2 - imp * 0.6 + (Math.random() - 0.5) * imp * 3
          on[i] = 1
        }
        if (speed > 6 && px > box.x0 && px < box.x1 && py > box.y0 && py < box.y1 && Math.random() < 0.6) {
          for (let s = 0; s < 1 + Math.round(Math.random()); s++) {
            slices.push({ y: py + (Math.random() - 0.5) * R * 1.6, h: cs * (0.5 + Math.random() * 3), x: px - R * 1.4, w: R * 2.8, shift: Math.sign(pointer.vx) * cs * (2 + Math.random() * 12), life: 0.08 + Math.random() * 0.22 })
          }
        }
      }
      slices = slices.filter((s) => (s.life -= dt) > 0)
      active.length = 0
      for (let i = 0; i < n; i++) {
        if (!on[i]) continue
        vx[i] += (Math.random() - 0.5) * dd[i] * 0.5 * dpr * k
        vy[i] += ((Math.random() - 0.5) * 0.5 - 0.05) * dd[i] * dpr * k
        const spring = 0.075 * (1 - dd[i]) ** 2 * k
        vx[i] = (vx[i] - ox[i] * spring) * damp
        vy[i] = (vy[i] - oy[i] * spring) * damp
        ox[i] += vx[i] * k
        oy[i] += vy[i] * k
        dd[i] = Math.max(0, dd[i] - life)
        if (dd[i] === 0 && Math.abs(ox[i]) < 0.35 && Math.abs(oy[i]) < 0.35 && Math.abs(vx[i]) < 0.08 && Math.abs(vy[i]) < 0.08) {
          ox[i] = oy[i] = vx[i] = vy[i] = 0
          on[i] = 0
        } else active.push(i)
      }
    }

    function renderText(target: HTMLCanvasElement) {
      const t = target.getContext('2d')!
      t.globalAlpha = 1
      t.clearRect(0, 0, W, H)
      t.drawImage(staticA, 0, 0)
      if (!active.length && !slices.length) return
      for (const i of active) t.clearRect(hx[i] - cs / 2, hy[i] - cs / 2, cs, cs)
      t.fillStyle = '#fff'
      for (const i of active) {
        if (dd[i] > 0.7 && rr[i] > 0.82) continue
        const sz = cs * (1 - dd[i] * (0.55 - 0.45 * rr[i]))
        const stretch = 1 + Math.min((Math.abs(vx[i]) / dpr) * 0.35, 3.5) * (dd[i] + 0.15)
        t.globalAlpha = 1 - dd[i] * 0.5
        t.fillRect(hx[i] + ox[i] - sz / 2 - (vx[i] < 0 ? sz * (stretch - 1) : 0), hy[i] + oy[i] - sz / 2, sz * stretch, sz)
      }
      t.globalAlpha = 1
      for (const s of slices) {
        t.clearRect(0, s.y, W, s.h)
        t.drawImage(staticA, 0, s.y, W, s.h, s.shift, s.y, W, s.h)
      }
    }

    function compose() {
      const S = img.s * dpr
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = FRONT_BG
      ctx.fillRect(0, 0, W, H)
      ctx.drawImage(textA, 0, 0)
      ctx.drawImage(front, img.x * dpr, img.y * dpr, S, S)
      if (maskMax <= 0.06) return

      const b = bufB.getContext('2d')!
      b.globalCompositeOperation = 'source-over'
      b.fillStyle = BACK_BG
      b.fillRect(0, 0, W, H)
      // back type: the same pixels, filled with the Blitz poster's iridescent sweep
      const tb = textB.getContext('2d')!
      tb.globalCompositeOperation = 'source-over'
      tb.clearRect(0, 0, W, H)
      tb.drawImage(textA, 0, 0)
      tb.globalCompositeOperation = 'source-in'
      const iris = tb.createLinearGradient(0, 0, W, H)
      iris.addColorStop(0, '#836EF9')
      iris.addColorStop(0.5, '#5EC8FF')
      iris.addColorStop(1, '#FF8AD8')
      tb.fillStyle = iris
      tb.fillRect(0, 0, W, H)
      b.drawImage(textB, 0, 0)
      b.drawImage(back, img.x * dpr, img.y * dpr, S, S)
      b.globalCompositeOperation = 'destination-in'
      b.imageSmoothingEnabled = true
      b.drawImage(maskCanvas, 0, 0, W, H)
      b.globalCompositeOperation = 'source-over'
      ctx.drawImage(bufB, 0, 0)
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.7
      ctx.drawImage(glowCanvas, 0, 0, W, H)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    let raf = 0
    let last = performance.now()
    let visible = true
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = dt * 60 || 1
      if (pointer.active) {
        pointer.vx += ((pointer.x - pointer.px) / k - pointer.vx) * 0.5
        pointer.vy += ((pointer.y - pointer.py) / k - pointer.vy) * 0.5
      } else {
        pointer.vx *= 0.8
        pointer.vy *= 0.8
      }
      pointer.px = pointer.x
      pointer.py = pointer.y
      updateMask(dt)
      if (!reduced) updateParticles(dt)
      renderText(textA)
      compose()
      if (visible) raf = requestAnimationFrame(frame)
    }

    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function move(e: PointerEvent) {
      const p = at(e)
      if (!pointer.active || pointer.fresh) {
        pointer.px = p.x
        pointer.py = p.y
        lastStamp = null
        pointer.fresh = false
      }
      pointer.x = p.x
      pointer.y = p.y
      pointer.active = true
    }
    const down = (e: PointerEvent) => {
      pointer.fresh = true
      move(e)
    }
    const leave = () => {
      pointer.active = false
    }
    const up = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') pointer.active = false
    }

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 120)
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && front) {
        last = performance.now()
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(frame)
      }
    })

    let cancelled = false
    Promise.all([load(FRONT_SRC), load(BACK_SRC), document.fonts.load(`400 100px ${family}`)])
      .then(([f, b]) => {
        if (cancelled) return
        front = f
        back = b
        resize()
        el.addEventListener('pointermove', move, { passive: true })
        el.addEventListener('pointerdown', down, { passive: true })
        el.addEventListener('pointerleave', leave, { passive: true })
        el.addEventListener('pointerup', up, { passive: true })
        window.addEventListener('resize', onResize)
        io.observe(el)
        raf = requestAnimationFrame(frame)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerup', up)
    }
  }, [])

  return (
    <div ref={hero} className="relative w-full h-[100svh] min-h-[560px] overflow-hidden cursor-crosshair select-none" style={{ background: FRONT_BG, touchAction: 'pan-y' }}>
      <span ref={font} className="font-poster absolute opacity-0 pointer-events-none" aria-hidden>.</span>
      <canvas
        ref={view}
        className="absolute inset-0 w-full h-full block"
        role="img"
        aria-label="A bare Socemon avatar behind giant BLITZ JACKET type; dragging across it reveals its twin wearing the Blitz Jacket."
      />
      {children}
    </div>
  )
}
