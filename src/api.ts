import type { Alert, Departure } from './types'
import type { Target } from './lines'

const BASE = import.meta.env.VITE_RTM_API_BASE ?? '/api/rtm'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return res.json()
}

const colorCache = new Map<string, Promise<Record<string, string>>>()
/** Line colours (PublicCode -> hex) for one line type, fetched once. */
export function lineColors(type: string): Promise<Record<string, string>> {
  if (!colorCache.has(type)) {
    colorCache.set(
      type,
      get<{ data: Record<string, { PublicCode: string; color: string }> }>(`getLines/${type}`)
        .then((r) => Object.fromEntries(Object.values(r.data).map((l) => [l.PublicCode, l.color])))
        .catch(() => ({})),
    )
  }
  return colorCache.get(type)!
}

interface RealTimeResponse {
  data: { temps_reel?: { DepartureTime: { Hour: string }; ReelHour: boolean }[] }
}

/** The API only returns a time of day ("14:15:48"); anchor it to today, rolling past midnight if needed. */
function toEpoch(hour: string, now: number): number {
  const [h, m, s] = hour.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, s ?? 0, 0)
  if (d.getTime() < now - 12 * 3600_000) d.setDate(d.getDate() + 1)
  return d.getTime()
}

export async function fetchDepartures(t: Target): Promise<Departure[]> {
  const r = await get<RealTimeResponse>(
    `getReelTime?lineRef=${encodeURIComponent(t.lineRef)}&direction=${t.direction}&pointRef=${encodeURIComponent(t.station.id)}`,
  )
  const now = Date.now()
  return (r.data.temps_reel ?? []).map((d) => ({ at: toEpoch(d.DepartureTime.Hour, now), realtime: d.ReelHour }))
}

interface AlertsResponse {
  data: Record<
    'AlertesToday' | 'AlertesComing',
    { ItemIdentifier: string; MessageA: string; MessageC: string; AffectedLine: { PublicCode: string }[] }[]
  >
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

export async function fetchAlerts(): Promise<Alert[]> {
  const r = await get<AlertsResponse>('getAlertes/FR/All')
  const out: Alert[] = []
  for (const [key, period] of [['AlertesToday', 'today'], ['AlertesComing', 'coming']] as const) {
    for (const a of r.data[key] ?? []) {
      out.push({
        id: a.ItemIdentifier,
        title: clean(a.MessageA),
        when: clean(a.MessageC),
        period,
        lines: a.AffectedLine.map((l) => l.PublicCode),
      })
    }
  }
  return out
}
