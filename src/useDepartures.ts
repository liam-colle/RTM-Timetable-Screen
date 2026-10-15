import { useEffect, useState } from 'react'
import { fetchDepartures } from './api'
import type { Target } from './lines'
import type { Departure } from './types'

export interface Row {
  target: Target
  departures: Departure[]
  error: boolean
  loaded: boolean
}

const key = (t: Target) => `${t.routeId}|${t.station.id}`
const STAGGER_MS = 2000

/**
 * Polls each target every `everySeconds`, spread out so requests for different rows never fire together.
 * `startedAt` anchors the refresh cycle: cycle k begins at startedAt + k * everySeconds.
 */
export function useDepartures(targets: Target[], everySeconds: number): { rows: Row[]; startedAt: number } {
  const [state, setState] = useState<Record<string, Omit<Row, 'target'>>>({})
  const [startedAt, setStartedAt] = useState(Date.now)

  useEffect(() => {
    setStartedAt(Date.now())
    let alive = true
    const timers: number[] = []
    targets.forEach((t, i) => {
      const run = async () => {
        let departures: Departure[] | null = null
        try {
          departures = await fetchDepartures(t)
        } catch {
          /* keep the previous departures on failure so the screen doesn't blank out */
        }
        if (!alive) return
        setState((s) => ({
          ...s,
          [key(t)]: { departures: departures ?? s[key(t)]?.departures ?? [], error: !departures, loaded: true },
        }))
      }
      timers.push(
        window.setTimeout(() => {
          run()
          timers.push(window.setInterval(run, everySeconds * 1000))
        }, i * STAGGER_MS),
      )
    })
    return () => {
      alive = false
      timers.forEach((id) => {
        clearTimeout(id)
        clearInterval(id)
      })
    }
  }, [targets, everySeconds])

  const empty = { departures: [] as Departure[], error: false, loaded: false }
  return { rows: targets.map((target) => ({ target, ...(state[key(target)] ?? empty) })), startedAt }
}
