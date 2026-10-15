import { useEffect, type RefObject } from 'react'

const SPEED_PX_PER_S = 30
const PAUSE_MS = 3000

/** Slowly scrolls the element down then back up when its content overflows, pausing at both ends. */
export function useAutoScroll(ref: RefObject<HTMLElement>, deps: unknown[]) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let dir = 1
    let pausedUntil = performance.now() + PAUSE_MS
    let last = performance.now()
    let pos = 0
    const tick = (now: number) => {
      const max = el.scrollHeight - el.clientHeight
      const dt = (now - last) / 1000
      last = now
      if (max > 1 && now >= pausedUntil) {
        pos = Math.min(max, Math.max(0, pos + dir * SPEED_PX_PER_S * dt))
        el.scrollTop = pos
        if (pos <= 0 || pos >= max) {
          dir = -dir
          pausedUntil = now + PAUSE_MS
        }
      } else if (max <= 1) {
        pos = 0
        el.scrollTop = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
