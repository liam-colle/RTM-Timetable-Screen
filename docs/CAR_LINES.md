# Car lines (lecar / Cartreize)

Inter-city coaches such as the **50 Aix – Marseille** are run by the Métropole Aix-Marseille-Provence (network *lecar*,
formerly *Cartreize*), **not by RTM**. They are not in `api.rtm.fr`: the RTM `getLines` endpoint only knows `metro`,
`tram` and `bus`, and the RTM "50" (`RTM:LNE:56`, Castellane – Les Escourtines) is an unrelated city bus.
Both can be configured; the lecar one is the `car` type.

## Where the data comes from

The Métropole publishes open data on transport.data.gouv.fr, dataset
[Réseaux urbains de la Métropole Aix-Marseille-Provence](https://transport.data.gouv.fr/datasets/reseaux-de-transports-en-commun-de-la-metropole-daix-marseille-provence-et-des-bouches-du-rhone)
(licence ODbL). We use its **GTFS CG13 Cartreize** resource through the stable data.gouv.fr link
`https://www.data.gouv.fr/api/1/datasets/r/10e025a1-9048-4c19-925a-466b2a79232f`.

- It is a **static timetable**, so car departures are **scheduled, not realtime**. The table shows them in italics.
- The feed has an end date (`feed_end_date`, currently mid-2027). The scraper warns when it has expired; re-run it to refresh.
- The dataset also lists SIRI (SOAP) realtime endpoints for part of the Cartreize lines (`https://siri.lametropolemobilite.fr/CTZ_*`).
  They are not used yet: they need SOAP requests, are rate-limited and have no CORS, so they would need a server-side proxy.

## Scraping

```bash
npm run scrape:cars                              # every lecar line except school circuits (S*)
npm run scrape:cars -- --lines 50,51,A2          # only some lines
npm run scrape:cars -- --include-school          # also the S100… school lines
npm run docs:lines                               # refresh docs/LINES.md afterwards
```

This is a single download of a single file, so the "pause between priorities" rule of the RTM API scraping guidelines
does not apply. It writes two files per line, with the lowercase code as file name:

| File | Purpose |
| --- | --- |
| `docs/lines/car/<code>.json` | Same format as the other line files (`id`, `name`, `directionIds`, `stationIds`). Stops come from the longest trip pattern of each direction, with extra stops of other patterns slotted in. `id`/`lineRef` is the GTFS `route_id` (e.g. `C13-50`), route keys are `<route_id>:<direction 0 or 1>`, `operator` is `CG13`. |
| `public/schedules/car/<code>.json` | Compact timetable served to the browser: line colour, service calendars (weekdays, date range, added/removed dates) and, per direction and stop, the departure times grouped by the services that share them. Boarding is excluded at the last stop of a trip. |

## Using it

Same config as other lines, by line code and stop name (accent/case-insensitive, partial names allowed):

```
?lines=car/50:Gare Routière,A1:Aéroport
```

```json
{ "line": "car/50", "stop": "Gare St Charles" }
```

The list of codes and stops is in [LINES.md](LINES.md).

Notes:
- **Code clashes:** lecar reuses numbers that RTM buses also use (15, 16, 25, 33, 34, 36, 38, 39, 48–55, 64, 68, 69, 72,
  78, 79, 88, 89, 100, 102…). A bare code such as `15` always means the **RTM** line when it exists; write `car/15` for
  the lecar one (`?lines=car/15:Gare Routière`, `{ "line": "car/50", "stop": "Gare St Charles" }`). Codes that only exist
  on lecar (e.g. `A1`, `A2`, `240`) work without the prefix, and the prefix is always accepted.
- Traffic alerts and the "!" markers only apply to RTM lines. An incident on RTM bus 50 never marks lecar 50.
- Departures are computed in the browser from the schedule, including services running past midnight (GTFS times above 24:00).
