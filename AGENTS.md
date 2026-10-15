# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, Antigravity, Cursor, …) working in this repo.

## What this is

A React + Vite + TypeScript station-screen that shows next departures for RTM (Marseille) lines in a table, styled after the RTM screens in `docs/design-guide/` (yellow header/footer, light-blue body, navy condensed type, red accents).

## Commands

- `npm run dev` – dev server (proxies `/api/rtm/*` to `https://api.rtm.fr/front/*`; the API has no CORS headers, so any deployment needs the same proxy or `VITE_RTM_API_BASE`)
- `npm run build` – typecheck + production build
- `npm run typecheck`
- `docker compose up -d --build` – nginx serving the built app on `${PORT:-8080}`, with the `/api/rtm` proxy; `public/config.json` is mounted so edits apply without a rebuild
- `npm run scrape -- --priority high|medium|low` – regenerate `docs/lines/**` (see below)
- `npm run scrape:cars [-- --lines 50,A2]` – lecar/Cartreize coach lines from the open GTFS (not RTM API; scheduled only). See `docs/CAR_LINES.md`
- `npm run docs:lines` – regenerate `docs/LINES.md` (all line codes and stop names); run it after every scrape

## Layout

- `src/config.ts` – config loading: defaults → `public/config.json` → URL params (highest priority)
- `src/lines.ts` – resolves friendly line/stop names (accent/case-insensitive) against `docs/lines/**/*.json`
- `src/api.ts` – RTM API calls (`getReelTime`, `getLines` for colours)
- `src/useDepartures.ts` – staggered polling
- `docs/lines/<metro|tram|bus|car>/<code>.json` – scraped line/stop data, the app's source of truth for stops; `public/schedules/car/` holds the GTFS timetables for `car` lines
- `docs/LINES.md` – generated list of every usable line code and stop; `docs/CAR_LINES.md` – how coach lines work
- `docs/API_example.md`, `docs/API_scrapping_guidelines.md` – read before touching API code

## Configuration

`public/config.json`: `title`, `refreshSeconds`, `maxDepartures`, `lines: [{ "line": "M1", "stop": "Castellane" }]`.
URL params override it: `?lines=M1:Castellane,T1:Noailles&refresh=300&max=3&title=…`. `?stop=` is the default stop for entries without one. A stop is **required** for every line (no terminus fallback); lines without one show a notice instead of rows. Lecar coach lines use the `car/` prefix when the number clashes with an RTM line (`car/50:Gare St Charles`).

## API rules (important)

- `getReelTime` is not truly realtime. **Never poll one line more often than every 5 minutes** (`MIN_REFRESH_SECONDS`); spread requests out.
- Direction param: `1` = route id ending in `A`, `2` = ending in `R`.
- All API/GTFS times are Paris wall-clock. Convert them only with `src/time.ts` (never `setHours`/local `Date` parts): kiosks often run in UTC.
- Scraping: follow `docs/API_scrapping_guidelines.md` exactly – high (metro + tram) → medium (B-prefixed buses, incl. BM*) → low (12, 91, 17, 15, 15S, 18), with **2–4 h between priorities**. The script enforces the 2 h minimum via `docs/lines/.scrape-state.json`. If the user says to stop or wait a day, stop. Don't hammer the API; the script waits 1.5 s between requests.
- Don't hand-edit the scraped JSON; re-run the script.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`, imperative, lowercase subject, ≤72 chars.
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Scopes e.g. `ui`, `config`, `api`, `scraper`, `lines`, `docs`.
Examples: `feat(config): read lines from url params`, `chore(lines): scrape medium priority bus lines`.
Keep commits small and focused; scraped data goes in its own `chore(lines)` commit. Only commit/push when the user asks. Never commit `node_modules`, `dist` or secrets.

## Code style

Match surrounding code; TypeScript strict; function components and hooks; plain CSS in `src/styles.css`; user-facing text in French.
