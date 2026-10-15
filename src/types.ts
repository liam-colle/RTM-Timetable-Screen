export interface Station {
  id: string
  sqlilineNumber: string
  operator: string
  lineRef: string
  Name: string
  Longitude: string
  Latitude: string
}

/** Shape of docs/lines/<type>/<code>.json (see docs/API_scrapping_guidelines.md). */
export interface LineFile {
  id: string
  name: string
  directionIds: Record<string, string>
  stationIds: Record<string, Station[]>
}

export interface LineSelection {
  /** Friendly line name, e.g. "M1". */
  line: string
  /** Friendly stop name; when omitted the terminus of each direction is used. */
  stop?: string
}

export interface AppConfig {
  title: string
  refreshSeconds: number
  maxDepartures: number
  lines: LineSelection[]
}

export interface Departure {
  /** Epoch ms. */
  at: number
  realtime: boolean
}

export interface Alert {
  id: string
  title: string
  when: string
  /** "today" = currently valid, "coming" = announced. */
  period: 'today' | 'coming'
  /** Affected PublicCodes as listed by the API (e.g. "M1", "B14", "15S"). */
  lines: string[]
}
