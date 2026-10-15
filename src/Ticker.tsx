import type { Alert } from './types'
import { norm } from './lines'

/** Endless right-to-left marquee through every incident, flagging which displayed lines each one affects (unaffected lines aren't mentioned). */
export function Ticker({ alerts, shownLines }: { alerts: Alert[]; shownLines: string[] }) {
  if (!alerts.length) return <div className="ticker calm">Aucune perturbation signalée sur le réseau</div>

  const items = alerts.map((a) => {
    const affected = new Set(a.lines.map(norm))
    return { alert: a, hit: shownLines.filter((l) => affected.has(norm(l))) }
  })
  const length = items.reduce((n, i) => n + i.alert.title.length + i.alert.when.length + 40, 0)

  const content = items.map(({ alert, hit }) => (
    <span className="incident" key={alert.id}>
      <b className={`tag ${alert.period}`}>{alert.period === 'today' ? 'En cours' : 'À venir'}</b>
      <span className="msg">{alert.title}</span>
      {alert.when && <span className="when">{alert.when}</span>}
      {hit.length > 0 && (
        <span className="hit">
          ⚠ Lignes concernées : {hit.map((l) => <b key={l} className="chip">{l}</b>)}
        </span>
      )}
      <span className="dot">◆</span>
    </span>
  ))

  return (
    <div className="ticker">
      <div className="ticker-label">Info trafic</div>
      <div className="ticker-window">
        {/* content is rendered twice and shifted by -50% so the loop is seamless */}
        <div className="ticker-track" style={{ animationDuration: `${Math.max(30, length / 12)}s` }}>
          <div>{content}</div>
          <div aria-hidden>{content}</div>
        </div>
      </div>
    </div>
  )
}
