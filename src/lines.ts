import type { LineFile, LineSelection, Station } from './types'

const files = import.meta.glob<LineFile>('../docs/lines/**/*.json', { eager: true, import: 'default' })

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const byName = new Map<string, { file: LineFile; type: string }>()
for (const [path, file] of Object.entries(files)) {
  byName.set(norm(file.name), { file, type: path.split('/').at(-2) ?? '' })
}

export const knownLines = () => [...byName.values()].map((v) => v.file.name)

export interface Target {
  line: string
  lineRef: string
  type: string
  routeId: string
  /** 1 = Aller, 2 = Retour (route ids end with A / R). */
  direction: 1 | 2
  destination: string
  station: Station
}

export function resolve(sel: LineSelection): { targets: Target[]; error?: string } {
  const entry = byName.get(norm(sel.line))
  if (!entry) return { targets: [], error: `Ligne inconnue : ${sel.line}` }
  const { file, type } = entry
  const targets: Target[] = []
  for (const [destination, routeId] of Object.entries(file.directionIds)) {
    const stations = file.stationIds[routeId] ?? []
    const station = sel.stop
      ? stations.find((s) => norm(s.Name) === norm(sel.stop!)) ??
        stations.find((s) => norm(s.Name).includes(norm(sel.stop!)))
      : stations[0]
    // The last stop of a route is the terminus: nothing to wait for there.
    if (!station || (sel.stop && station === stations.at(-1))) continue
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
