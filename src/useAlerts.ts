import { useEffect, useState } from 'react'
import { fetchAlerts } from './api'
import type { Alert } from './types'

/** Alerts are one request for the whole network; refreshed on the same cadence as departures. */
export function useAlerts(everySeconds: number): Alert[] {
  const [alerts, setAlerts] = useState<Alert[]>([])
  useEffect(() => {
    let alive = true
    const run = () =>
      fetchAlerts().then(
        (a) => alive && setAlerts(a),
        () => {}, // keep the last known alerts
      )
    run()
    const id = setInterval(run, everySeconds * 1000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [everySeconds])
  return alerts
}
