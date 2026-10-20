'use client'
import { MotionConfig } from 'framer-motion'

/** Every framer-motion transform animation below this respects prefers-reduced-motion (opacity still animates). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
