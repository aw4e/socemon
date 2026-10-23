import { useEffect, useRef } from 'react'

/* A phone scrolls a sideways row with a finger. On a computer the row also needs the mouse wheel and a click-and-drag,
   or it looks cut off with no way to reach the rest. Spread the result onto the scrolling element:
   <div {...useDragScroll()} className="flex overflow-x-auto ..."> */
export function useDragScroll() {
  const ref = useRef<HTMLDivElement & HTMLUListElement>(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    /* a plain vertical wheel turns the row sideways while it overflows; a sideways wheel or trackpad is left alone */
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return {
    ref,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      drag.current = { active: true, moved: false, startX: e.clientX, startLeft: e.currentTarget.scrollLeft }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d.active) return
      const dx = e.clientX - d.startX
      if (!d.moved && Math.abs(dx) > 4) {
        d.moved = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      if (d.moved) e.currentTarget.scrollLeft = d.startLeft - dx
    },
    onPointerUp: () => { drag.current.active = false },
    onPointerCancel: () => { drag.current.active = false },
    /* a drag that ends over a chip must not also press it */
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current.moved) {
        e.stopPropagation()
        e.preventDefault()
        drag.current.moved = false
      }
    },
  }
}
