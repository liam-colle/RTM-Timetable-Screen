#!/usr/bin/env node
// Scrapes RTM lines/stops into docs/lines/<type>/<code>.json
// Follows docs/API_scrapping_guidelines.md (format, priorities, pauses between priorities).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.rtm.fr/front'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LINES_DIR = join(ROOT, 'docs', 'lines')
const STATE_FILE = join(LINES_DIR, '.scrape-state.json')
const REQUEST_DELAY_MS = 1500
const MIN_PAUSE_BETWEEN_PRIORITIES_MS = 2 * 60 * 60 * 1000 // guideline: 2 to 4 hours

const LOW_PRIORITY_CODES = ['12', '91', '17', '15', '15S', '18']
const PRIORITIES = {
  // Endpoints to query; the metro endpoint also lists BM* bus lines, so output is filtered by sqliType.
  high: { types: ['metro', 'tram'], match: (l) => ['metro', 'tram'].includes(l.sqliType) },
  medium: { types: ['bus', 'metro'], match: (l) => l.sqliType === 'bus' && /^B/i.test(l.PublicCode) },
  low: { types: ['bus'], match: (l) => l.sqliType === 'bus' && LOW_PRIORITY_CODES.includes(l.PublicCode) },
}
const ORDER = ['high', 'medium', 'low']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(path) {
  await sleep(REQUEST_DELAY_MS)
  const res = await fetch(`${API}/${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return res.json()
}
const readState = () => readFile(STATE_FILE, 'utf8').then(JSON.parse, () => ({}))

const args = process.argv.slice(2)
const priority = args[args.indexOf('--priority') + 1]
const force = args.includes('--force')
if (!PRIORITIES[priority]) {
  console.error('Usage: node scripts/scrape-lines.mjs --priority <high|medium|low> [--force]')
  process.exit(1)
}

const state = await readState()
const previous = ORDER[ORDER.indexOf(priority) - 1]
if (previous && !force) {
  const doneAt = state[previous] && Date.parse(state[previous])
  if (!doneAt) {
    console.error(`"${previous}" priority has not been scraped yet. Scrape it first.`)
    process.exit(1)
  }
  const waitMs = doneAt + MIN_PAUSE_BETWEEN_PRIORITIES_MS - Date.now()
  if (waitMs > 0) {
    console.error(`Guidelines require a 2-4h pause after "${previous}". Wait ${Math.ceil(waitMs / 60000)} more min.`)
    process.exit(1)
  }
}

const { types, match } = PRIORITIES[priority]
for (const type of types) {
  const lines = Object.values((await get(`getLines/${type}`)).data).filter(match)
  for (const line of lines) {
    const routes = (await get(`getRoutes/${line.id}`)).data
    const out = { id: line.id, name: line.PublicCode, directionIds: {}, stationIds: {} }
    for (const [rteId, route] of Object.entries(routes)) {
      let label = route.DirectionStations
      if (out.directionIds[label]) label = `${label} (${route.Direction})`
      out.directionIds[label] = rteId
      const stations = (await get(`getStations/${rteId}`)).data
      out.stationIds[rteId] = stations.map((s) => ({
        id: s.refNEtex,
        sqlilineNumber: s.sqlilineNumber,
        operator: s.operator,
        lineRef: s.lineRef,
        Name: s.Name,
        Longitude: s.Longitude,
        Latitude: s.Latitude,
      }))
      console.log(`${line.PublicCode} ${rteId} -> ${label}: ${stations.length} stops (DirectionRef ${route.DirectionRef})`)
    }
    const dir = join(LINES_DIR, line.sqliType)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, `${line.PublicCode.toLowerCase()}.json`), JSON.stringify(out, null, 4) + '\n')
  }
}
state[priority] = new Date().toISOString()
await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n')
console.log(`Done: ${priority}`)
