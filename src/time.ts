/**
 * The RTM API and the GTFS timetables use Paris wall-clock times. Never interpret them in the browser's timezone:
 * a kiosk (e.g. Raspberry Pi) often runs in UTC, which made every wait appear 60-120 minutes too long.
 */
export const TIMEZONE = 'Europe/Paris'

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export interface ParisDate {
  y: number
  m: number // 1-12
  d: number
}

function parts(epoch: number) {
  const p = Object.fromEntries(fmt.formatToParts(epoch).map((x) => [x.type, +x.value]))
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute, s: p.second }
}

export const parisToday = (now = Date.now()): ParisDate => {
  const { y, m, d } = parts(now)
  return { y, m, d }
}

export function addDays(date: ParisDate, n: number): ParisDate {
  const u = new Date(Date.UTC(date.y, date.m - 1, date.d + n))
  return { y: u.getUTCFullYear(), m: u.getUTCMonth() + 1, d: u.getUTCDate() }
}

/** 0 = Monday … 6 = Sunday. */
export const weekday = (date: ParisDate) => (new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay() + 6) % 7

export const dateNumber = (date: ParisDate) => date.y * 10000 + date.m * 100 + date.d

/** Epoch ms of a Paris wall-clock time; hours may exceed 23 (GTFS "25:10" = 01:10 the next day). */
export function parisEpoch(date: ParisDate, h: number, min: number, s = 0): number {
  const wall = Date.UTC(date.y, date.m - 1, date.d, h, min, s)
  const offsetAt = (t: number) => {
    const p = parts(t)
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(t / 1000) * 1000
  }
  const first = wall - offsetAt(wall)
  return wall - offsetAt(first)
}
