import type { Alert, Departure } from './types'
import type { Target } from './lines'
import { addDays, dateNumber, parisEpoch, parisToday, weekday } from './time'

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

/** The API only returns a Paris time of day ("14:15:48"); anchor it to today, rolling past midnight if needed. */
function toEpoch(hour: string, now: number): number {
  const [h, m, s] = hour.split(':').map(Number)
  const today = parisToday(now)
  const at = parisEpoch(today, h, m, s ?? 0)
  return at < now - 12 * 3600_000 ? parisEpoch(addDays(today, 1), h, m, s ?? 0) : at
}

export async function fetchDepartures(t: Target): Promise<Departure[]> {
  if (t.type === 'car') return scheduledDepartures(t)
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

interface Schedule {
  color: string
  services: Record<string, { days: number[]; start: number; end: number; added: number[]; removed: number[] }>
  /** routeKey -> stopId -> [["HH:MM HH:MM …", [serviceIds]], …] */
  departures: Record<string, Record<string, [string, string[]][]>>
}

// `car` lines (lecar / Cartreize) are not on the RTM API: their timetables come from the scraped GTFS (docs/CAR_LINES.md).
const scheduleCache = new Map<string, Promise<Schedule>>()
function loadSchedule(t: Target): Promise<Schedule> {
  const url = `${import.meta.env.BASE_URL}schedules/car/${t.line.toLowerCase()}.json`
  if (!scheduleCache.has(url)) {
    const p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`)
      return r.json() as Promise<Schedule>
    })
    p.catch(() => scheduleCache.delete(url)) // retry on the next refresh
    scheduleCache.set(url, p)
  }
  return scheduleCache.get(url)!
}

export const carColor = (t: Target) => loadSchedule(t).then((s) => s.color)

async function scheduledDepartures(t: Target): Promise<Departure[]> {
  const schedule = await loadSchedule(t)
  const groups = schedule.departures[t.routeId]?.[t.station.id] ?? []
  const now = Date.now()
  const out: Departure[] = []
  // yesterday too: GTFS times past 24:00 belong to the previous service day
  for (const offset of [-1, 0, 1]) {
    const day = addDays(parisToday(now), offset)
    const n = dateNumber(day)
    const dow = weekday(day)
    for (const [times, serviceIds] of groups) {
      const active = serviceIds.some((id) => {
        const s = schedule.services[id]
        if (!s || s.removed.includes(n)) return false
        return s.added.includes(n) || (s.days.includes(dow) && n >= s.start && n <= s.end)
      })
      if (!active) continue
      for (const time of times.split(' ')) {
        const [h, m] = time.split(':').map(Number)
        const at = parisEpoch(day, h, m)
        if (at > now - 60_000) out.push({ at, realtime: false })
      }
    }
  }
  return out.sort((a, b) => a.at - b.at).filter((d, i, all) => !i || d.at !== all[i - 1].at)
}
