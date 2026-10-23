'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from 'framer-motion'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/'

/** Poster type that decodes from random glyphs, left to right, the first time it scrolls into view. */
export function ScrambleIn({ text, className, style, delay = 0 }: { text: string; className?: string; style?: React.CSSProperties; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(text) // server and no-JS render the real words
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer: ReturnType<typeof setInterval> | undefined
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      let cursor = 0
      setTimeout(() => {
        timer = setInterval(() => {
          cursor += 0.6
          setShown(
            [...text].map((c, i) => (c === ' ' || i < cursor ? c : i < cursor + 4 ? CHARS[Math.floor(Math.random() * CHARS.length)] : ' ')).join(''),
          )
          if (cursor >= text.length) clearInterval(timer)
        }, 28)
      }, delay)
    }, { threshold: 0.4 })
    setShown([...text].map((c) => (c === ' ' ? c : ' ')).join(''))
    io.observe(el)
    return () => {
      io.disconnect()
      clearInterval(timer)
    }
  }, [text, delay])
  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  )
}

/** A paragraph laid back in 3D that rises and straightens as you scroll through it. */
export function TiltText({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 40, damping: 24, mass: 0.8 })
  const y = useTransform(smooth, [0, 1], [90, -90])
  const tilt = useTransform(smooth, [0, 0.5, 1], [28, 6, -4])
  const opacity = useTransform(smooth, [0.1, 0.35], [0, 1])
  const transform = useMotionTemplate`rotateX(${tilt}deg) translateY(${y}px)`
  return (
    <div ref={ref} style={{ perspective: 600 }}>
      <motion.div style={{ transform, opacity }} className={className}>{children}</motion.div>
    </div>
  )
}
