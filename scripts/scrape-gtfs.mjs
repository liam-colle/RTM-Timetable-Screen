#!/usr/bin/env node
// Scrapes the Métropole's open GTFS (Cartreize / lecar coach lines) into:
//   docs/lines/car/<code>.json          same format as the RTM-API line files (see docs/API_scrapping_guidelines.md)
//   public/schedules/car/<code>.json    compact timetables the app uses for scheduled departures
// One download of one static file: no API hammering involved. See docs/CAR_LINES.md.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strFromU8, unzipSync } from 'fflate'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Stable data.gouv.fr redirect to the "GTFS CG13 Cartreize" resource of the
// "Réseaux urbains de la Métropole Aix-Marseille-Provence" dataset (transport.data.gouv.fr).
const DEFAULT_URL = 'https://www.data.gouv.fr/api/1/datasets/r/10e025a1-9048-4c19-925a-466b2a79232f'

const args = process.argv.slice(2)
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const only = opt('--lines')?.split(',').map((s) => s.trim().toUpperCase())
const includeSchool = args.includes('--include-school')
const url = opt('--url') ?? DEFAULT_URL

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') (text[i + 1] === '"' ? ((field += '"'), i++) : (quoted = false))
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') (row.push(field), (field = ''))
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field), (field = '')
      rows.push(row), (row = [])
    } else field += c
  }
  if (field || row.length) (row.push(field), rows.push(row))
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '')
  head[0] = head[0].replace(/^﻿/, '')
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

console.log(`Downloading ${url}`)
const res = await fetch(url, { redirect: 'follow' })
if (!res.ok) throw new Error(`GTFS download failed: ${res.status}`)
const files = unzipSync(new Uint8Array(await res.arrayBuffer()))
const table = (name) => parseCsv(strFromU8(files[`${name}.txt`]))

const feed = table('feed_info')[0]
console.log(`Feed ${feed.feed_version}: valid ${feed.feed_start_date} -> ${feed.feed_end_date}`)
if (feed.feed_end_date < new Date().toISOString().slice(0, 10).replaceAll('-', '')) {
  console.warn('WARNING: this feed has expired; fetch a newer one.')
}

const routes = table('routes').filter(
  (r) => (only ? only.includes(r.route_short_name.toUpperCase()) : includeSchool || !/^S\d/.test(r.route_short_name)),
)
const routeById = new Map(routes.map((r) => [r.route_id, r]))
if (!routes.length) throw new Error('No matching route')

const stops = new Map(table('stops').map((s) => [s.stop_id, s]))
const trips = new Map()
for (const t of table('trips')) if (routeById.has(t.route_id)) trips.set(t.trip_id, t)

const stopTimes = new Map() // trip_id -> [{stop, seq, dep, pickup}]
for (const st of table('stop_times')) {
  if (!trips.has(st.trip_id)) continue
  const list = stopTimes.get(st.trip_id) ?? stopTimes.set(st.trip_id, []).get(st.trip_id)
  list.push({ stop: st.stop_id, seq: +st.stop_sequence, dep: st.departure_time || st.arrival_time, pickup: st.pickup_type })
}

const cal = new Map(table('calendar').map((c) => [c.service_id, c]))
const exceptions = new Map()
for (const e of table('calendar_dates')) {
  const x = exceptions.get(e.service_id) ?? exceptions.set(e.service_id, { added: [], removed: [] }).get(e.service_id)
  ;(e.exception_type === '1' ? x.added : x.removed).push(+e.date)
}

const hhmm = (t) => t.slice(0, 5) // GTFS allows >24h ("25:10:00"); kept as is
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

await mkdir(join(ROOT, 'docs/lines/car'), { recursive: true })
await mkdir(join(ROOT, 'public/schedules/car'), { recursive: true })

let written = 0
for (const route of routes) {
  const code = route.route_short_name
  const routeTrips = [...trips.values()].filter((t) => t.route_id === route.route_id)
  const directionIds = {}
  const stationIds = {}
  const schedule = { id: route.route_id, name: code, color: `#${route.route_color || '1b2a4a'}`, feed: { start: +feed.feed_start_date, end: +feed.feed_end_date }, services: {}, departures: {} }
  const usedServices = new Set()

  for (const dir of ['0', '1']) {
    const dirTrips = routeTrips.filter((t) => t.direction_id === dir && stopTimes.has(t.trip_id))
    if (!dirTrips.length) continue
    const routeKey = `${route.route_id}:${dir}`
    const patterns = new Map() // stop sequence signature -> {stops, count}
    for (const t of dirTrips) {
      const ids = stopTimes.get(t.trip_id).sort((a, b) => a.seq - b.seq).map((s) => s.stop)
      const p = patterns.get(ids.join('|')) ?? patterns.set(ids.join('|'), { ids, count: 0 }).get(ids.join('|'))
      p.count++
    }
    // canonical ordering: longest pattern, then slot other patterns' extra stops after their predecessor
    const sorted = [...patterns.values()].sort((a, b) => b.ids.length - a.ids.length || b.count - a.count)
    const order = [...sorted[0].ids]
    for (const p of sorted.slice(1)) {
      p.ids.forEach((id, i) => {
        if (order.includes(id)) return
        const prev = p.ids.slice(0, i).reverse().find((x) => order.includes(x))
        order.splice(prev ? order.indexOf(prev) + 1 : 0, 0, id)
      })
    }
    const headsigns = new Map()
    for (const t of dirTrips) headsigns.set(t.trip_headsign, (headsigns.get(t.trip_headsign) ?? 0) + 1)
    let label = route[`direction${dir}_name`] || [...headsigns].sort((a, b) => b[1] - a[1])[0][0] || `Direction ${dir}`
    if (directionIds[label]) label = `${label} (${dir === '0' ? 'Aller' : 'Retour'})`
    directionIds[label] = routeKey
    stationIds[routeKey] = order.map((id) => {
      const s = stops.get(id)
      return { id, sqlilineNumber: code, operator: 'CG13', lineRef: route.route_id, Name: s.stop_name, Longitude: s.stop_lon, Latitude: s.stop_lat }
    })

    const byStop = {}
    for (const t of dirTrips) {
      const times = stopTimes.get(t.trip_id)
      times.forEach((st, i) => {
        if (i === times.length - 1 || st.pickup === '1' || !st.dep) return // no boarding here
        const perService = (byStop[st.stop] ??= {})
        ;(perService[t.service_id] ??= []).push(hhmm(st.dep))
      })
      usedServices.add(t.service_id)
    }
    // stop -> [[ "HH:MM HH:MM ...", [serviceIds sharing exactly these times] ], ...]  (many services repeat the same times)
    for (const [stop, perService] of Object.entries(byStop)) {
      const grouped = new Map()
      for (const [sid, list] of Object.entries(perService)) {
        const key = list.sort().join(' ')
        grouped.set(key, [...(grouped.get(key) ?? []), sid])
      }
      byStop[stop] = [...grouped]
    }
    schedule.departures[routeKey] = byStop
  }

  for (const sid of usedServices) {
    const c = cal.get(sid)
    const x = exceptions.get(sid) ?? { added: [], removed: [] }
    schedule.services[sid] = {
      days: c ? DAYS.map((d, i) => (c[d] === '1' ? i : -1)).filter((i) => i >= 0) : [],
      start: c ? +c.start_date : 0,
      end: c ? +c.end_date : 0,
      added: x.added,
      removed: x.removed,
    }
  }

  const file = `${code.toLowerCase()}.json`
  await writeFile(join(ROOT, 'docs/lines/car', file), JSON.stringify({ id: route.route_id, name: code, directionIds, stationIds }, null, 4) + '\n')
  await writeFile(join(ROOT, 'public/schedules/car', file), JSON.stringify(schedule))
  console.log(`${code} (${route.route_long_name}): ${Object.entries(stationIds).map(([k, v]) => v.length).join('/')} stops`)
  written++
}
console.log(`Done: ${written} lines`)
