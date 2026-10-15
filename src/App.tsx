import { useEffect, useMemo, useRef, useState } from 'react'
import { carColor, lineColors } from './api'
import { loadConfig } from './config'
import { knownLines, norm, resolve, type Target } from './lines'
import { TIMEZONE } from './time'
import { useDepartures } from './useDepartures'
import { useAlerts } from './useAlerts'
import { useAutoScroll } from './useAutoScroll'
import { Ticker } from './Ticker'
import type { AppConfig } from './types'

const FALLBACK_COLOR = '#1b2a4a'

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

function Clock() {
  const now = useNow(1000)
  return (
    <span className="pill pill-clock">
      {new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })}
    </span>
  )
}

function formatWait(at: number, now: number) {
  const min = Math.floor((at - now) / 60000)
  if (min <= 0) return { text: 'À l’approche', soon: true }
  return { text: `${min} min`, soon: min <= 2 }
}

function Timetable({ cfg, onCycleStart }: { cfg: AppConfig; onCycleStart: (t: number) => void }) {
  const { targets, errors } = useMemo(() => {
    const targets: Target[] = []
    const errors: string[] = []
    for (const sel of cfg.lines) {
      const r = resolve(sel)
      targets.push(...r.targets)
      if (r.error) errors.push(r.error)
    }
    return { targets, errors }
  }, [cfg])
  const { rows, startedAt } = useDepartures(targets, cfg.refreshSeconds)
  useEffect(() => onCycleStart(startedAt), [startedAt, onCycleStart])
  const alerts = useAlerts(cfg.refreshSeconds)
  // RTM alerts are keyed by RTM line codes; a lecar "50" must not be flagged because RTM bus 50 has an incident.
  const rtmTargets = useMemo(() => targets.filter((t) => t.type !== 'car'), [targets])
  const shownLines = useMemo(() => [...new Set(rtmTargets.map((t) => t.line))], [rtmTargets])
  const disrupted = useMemo(() => new Set(alerts.filter((a) => a.period === 'today').flatMap((a) => a.lines.map(norm))), [alerts])
  const isDisrupted = (t: Target) => t.type !== 'car' && disrupted.has(norm(t.line))
  const scrollRef = useRef<HTMLDivElement>(null)
  useAutoScroll(scrollRef, [rows.length])
  const now = useNow(15_000)
  const [colors, setColors] = useState<Record<string, string>>({})

  useEffect(() => {
    const types = [...new Set(targets.map((t) => t.type))].filter((t) => t !== 'car')
    Promise.all(types.map(lineColors)).then((all) => setColors((c) => ({ ...c, ...Object.fromEntries(types.flatMap((ty, i) => Object.entries(all[i]).map(([code, col]) => [`${ty}/${code}`, col]))) })))
    for (const t of targets.filter((t) => t.type === 'car')) {
      carColor(t).then((color) => setColors((c) => ({ ...c, [`car/${t.line}`]: color }))).catch(() => {})
    }
  }, [targets])

  return (
    <>
      <div className="scroller" ref={scrollRef}>
      <table className="timetable">
        <thead>
          <tr>
            <th>Ligne</th>
            <th>Direction</th>
            <th>Arrêt</th>
            <th>Prochains passages</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ target: t, departures, error, loaded }) => {
            const upcoming = departures.filter((d) => d.at > now - 30_000).slice(0, cfg.maxDepartures)
            return (
              <tr key={`${t.routeId}|${t.station.id}`} className={isDisrupted(t) ? 'disrupted' : undefined}>
                <td>
                  <span className="badge" style={{ background: colors[`${t.type}/${t.line}`] ?? FALLBACK_COLOR }}>
                    {t.line}
                    {isDisrupted(t) && <span className="warn" title="Perturbation">!</span>}
                  </span>
                </td>
                <td className="dest">{t.destination}</td>
                <td className="stop">{t.station.Name}</td>
                <td>
                  <div className="times">
                    {upcoming.map((d) => {
                      const w = formatWait(d.at, now)
                      return (
                        <span key={d.at} className={`time${w.soon ? ' soon' : ''}${d.realtime ? '' : ' theoretical'}`}>
                          {w.text}
                        </span>
                      )
                    })}
                    {!upcoming.length && (
                      <span className="muted">{!loaded ? 'Chargement…' : error ? 'Indisponible' : 'Aucun passage'}</span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      <Ticker alerts={alerts} shownLines={shownLines} />
      {errors.length > 0 && (
        <div className="notice">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
          <p>Lignes disponibles : {knownLines().join(', ')}</p>
        </div>
      )}
      {!cfg.lines.length && <div className="notice">Aucune ligne configurée (config.json ou ?lines=M1,T1).</div>}
    </>
  )
}

function RefreshTimer({ startedAt, everySeconds }: { startedAt: number; everySeconds: number }) {
  const now = useNow(1000)
  const period = everySeconds * 1000
  const left = period - ((now - startedAt) % period)
  const m = Math.floor(left / 60000)
  const sec = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  return (
    <span className="refresh">
      Prochaine mise à jour dans <b>{m}:{sec}</b>
      <span className="refresh-bar">
        <i style={{ width: `${100 - (left / period) * 100}%` }} />
      </span>
    </span>
  )
}

export default function App() {
  const [cfg, setCfg] = useState<AppConfig | null>(null)
  const [cycleStart, setCycleStart] = useState<number | null>(null)
  useEffect(() => {
    loadConfig().then(setCfg)
  }, [])

  return (
    <div className="screen">
      <header>
        <div className="brand">
          <span className="logo">RTM</span>
          <span className="sep" />
          <span className="title">{cfg?.title}</span>
        </div>
        <Clock />
      </header>
      <main>{cfg && <Timetable cfg={cfg} onCycleStart={setCycleStart} />}</main>
      <footer>
        <span>
          <b>rtm.fr</b>
        </span>
        {cfg && cycleStart && <RefreshTimer startedAt={cycleStart} everySeconds={cfg.refreshSeconds} />}
      </footer>
    </div>
  )
}
