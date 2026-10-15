import type { LineFile, LineSelection, Station } from './types'

const files = import.meta.glob<LineFile>('../docs/lines/**/*.json', { eager: true, import: 'default' })

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

interface Entry {
  file: LineFile
  type: string
}
const byName = new Map<string, Entry[]>()
for (const [path, file] of Object.entries(files)) {
  const list = byName.get(norm(file.name)) ?? byName.set(norm(file.name), []).get(norm(file.name))!
  list.push({ file, type: path.split('/').at(-2) ?? '' })
}

/**
 * "M1" or "15" -> the RTM line; "car/15" -> the lecar line. Unqualified codes prefer RTM lines because
 * lecar reuses some numbers (15, 16, 50, 64, 72…), see docs/CAR_LINES.md.
 */
function findLine(code: string): Entry | undefined {
  const [maybeType, ...rest] = code.split('/')
  const typed = rest.length > 0
  const entries = byName.get(norm(typed ? rest.join('/') : code)) ?? []
  if (typed) return entries.find((e) => e.type === maybeType.trim().toLowerCase())
  return entries.find((e) => e.type !== 'car') ?? entries[0]
}

export const knownLines = () =>
  [...byName.values()].flatMap((v) => v.map((e) => (e.type === 'car' && v.length > 1 ? `car/${e.file.name}` : e.file.name)))

export interface Target {
  line: string
  lineRef: string
  type: string
  routeId: string
  /** 1 = Aller, 2 = Retour (RTM route ids end with A / R; unused for scheduled `car` lines). */
  direction: 1 | 2
  destination: string
  station: Station
}

export function resolve(sel: LineSelection): { targets: Target[]; error?: string } {
  const entry = findLine(sel.line)
  if (!entry) return { targets: [], error: `Ligne inconnue : ${sel.line}` }
  const { file, type } = entry
  // A line without a stop used to fall back to each direction's terminus, which showed rows nobody asked for.
  if (!sel.stop) return { targets: [], error: `Aucun arrêt pour ${file.name} : écrivez ${file.name}:Nom de l’arrêt` }
  const wanted = norm(sel.stop)
  const targets: Target[] = []
  for (const [destination, routeId] of Object.entries(file.directionIds)) {
    const stations = file.stationIds[routeId] ?? []
    const station =
      stations.find((s) => norm(s.Name) === wanted) ??
      stations.find((s) => norm(s.Name).startsWith(wanted)) ??
      stations.find((s) => norm(s.Name).includes(wanted))
    // The last stop of a route is the terminus: nothing to wait for there.
    if (!station || station === stations.at(-1)) continue
    targets.push({
      line: file.name,
      lineRef: file.id,
      type,
      routeId,
      direction: routeId.endsWith('R') ? 2 : 1,
      destination: destination.replace(/ \((Aller|Retour)\)$/, ''),
      station,
    })
  }
  return targets.length
    ? { targets }
    : { targets, error: `Arrêt inconnu sur ${file.name} : ${sel.stop}` }
}
