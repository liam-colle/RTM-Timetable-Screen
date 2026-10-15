import type { AppConfig, LineSelection } from './types'

const DEFAULTS: AppConfig = { title: 'Prochains passages', refreshSeconds: 300, maxDepartures: 3, lines: [] }
/** The official site spaces realtime requests per line by 5 minutes (the data itself only moves that fast). */
export const RECOMMENDED_REFRESH_SECONDS = 300
/** Hard floor so a typo (e.g. 1) can't hammer the API. */
export const MIN_REFRESH_SECONDS = 30

/** "M1:Castellane,T1" -> [{line:"M1",stop:"Castellane"},{line:"T1"}]. A bare `stop` param applies to entries without one. */
function parseLines(raw: string, defaultStop?: string): LineSelection[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [line, ...rest] = s.split(':')
      const stop = rest.join(':').trim() || defaultStop
      return { line: line.trim(), ...(stop ? { stop } : {}) }
    })
}

/**
 * Config sources, lowest to highest priority: built-in defaults, /config.json, URL params.
 * URL params: ?lines=M1:Castellane,T1&stop=Noailles&refresh=300&max=3&title=Mon%20ecran
 */
export async function loadConfig(search = window.location.search): Promise<AppConfig> {
  let file: Partial<AppConfig> = {}
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (res.ok) file = await res.json()
  } catch {
    /* config file is optional */
  }
  const cfg: AppConfig = { ...DEFAULTS, ...file }
  const p = new URLSearchParams(search)
  if (p.has('lines')) cfg.lines = parseLines(p.get('lines')!, p.get('stop') ?? undefined)
  else if (p.has('stop')) cfg.lines = cfg.lines.map((l) => ({ ...l, stop: p.get('stop')! }))
  if (p.has('title')) cfg.title = p.get('title')!
  if (p.has('refresh')) cfg.refreshSeconds = Number(p.get('refresh')) || cfg.refreshSeconds
  if (p.has('max')) cfg.maxDepartures = Number(p.get('max')) || cfg.maxDepartures
  cfg.refreshSeconds = Math.max(MIN_REFRESH_SECONDS, cfg.refreshSeconds)
  if (cfg.refreshSeconds < RECOMMENDED_REFRESH_SECONDS) {
    console.warn(`refreshSeconds=${cfg.refreshSeconds} is below the 5 min the official site uses; the API data may not change that often.`)
  }
  return cfg
}
