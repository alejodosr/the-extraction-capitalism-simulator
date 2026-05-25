# The Extraction: Capitalism Simulator

> An open-source, agent-based simulation of a market economy. Because if the people who manage the system can't seem to model it, the rest of us may as well try at home.

## What this is

The Extraction simulates a small closed economy — workers, capitalists, firms across five sectors (food, clothing, energy, transportation, housing), and a state with a treasury — and lets it run for as many years as you choose. You set the tax regime, the initial distribution of wealth, productivity coefficients, markups, propensities, welfare and subsidy ratios. The engine plays out the consequences year by year. Then it shows you the Gini coefficient, the share of wealth at the top, who got pushed into social exclusion, and how much of every dollar paid out as income actually came back as consumption.

It is not a forecasting tool. It is a sandbox for the kind of question — *"what happens if we shift the corporate tax by five points and let it compound for two decades?"* — that real economies do not give us the luxury of asking twice.

## Quick start

```bash
npm install
npm run dev      # localhost:5173
```

No backend. No API keys. No telemetry. Nothing leaves your machine.

## Architecture

Two layers, strictly disjoint, communicating only via `postMessage`:

- **Engine** (`src/engine/`) — pure TypeScript, no DOM, no store access. Each simulated year flows through an ordered eight-phase pipeline:

  `production → pricing → income → taxation → state expenditure → consumption → classification → reinvestment`

- **UI** (`src/components/`, `src/store/`) — four screens (Setup, Dashboard, Compare, System Explained), Zustand for state, Recharts for time series, d3-sankey for the money-flow diagram.

The engine runs in a Web Worker. The UI thread never executes simulation code. The boundary is the point.

## Invariants

The engine treats these as correctness properties, not aspirations. If any of them breaks, the run is wrong, not interesting:

- **Money is conserved.** `Σ wealth + Σ income + treasury + Σ capital reserves` equals the configured money supply at the end of every year.
- **Population is conserved.** Agents are not created, destroyed, or reassigned to a different role after initialization (a worker stays a worker, a capitalist stays a capitalist).
- **Wealth is non-negative.** Consumption caps spending; the simulator does not push anyone into the red on its own.
- **Employment is bidirectionally consistent.** Every `agent.employedAt` resolves to a firm whose `employeeIds` lists the agent.

The implementation brief in `THE_EXTRACTION_IMPLEMENTATION_BRIEF.md` is the authoritative reference for types, phase semantics, and visual design.

## Stack

React + TypeScript (Vite) · Zustand · Recharts · d3-sankey · Tailwind CSS · Web Workers.

## Scripts

```bash
npm run dev         # development server
npm run build       # typecheck and bundle
npm run typecheck   # types only
npm run preview     # serve the built bundle
```

## Status

v1. Persistence is `localStorage`-only; runs are stored as `config + metrics`, not raw agent state, so a few dozen comfortably fit in the 5 MB budget.

Treat the model as a rigorously specified toy, not a policy instrument. The point is the same as for any other toy: by playing with it, one learns the shape of the thing.

## Deployment (Hetzner CPX11)

The app is a static SPA — there is nothing to run server-side. The Dockerfile in this repo builds the bundle with Node, then serves it with Caddy (gzip, immutable asset caching, SPA fallback, automatic HTTPS when a domain is configured).

A CPX11 (2 vCPU / 2 GB RAM / 40 GB disk, Ubuntu 24.04) is enough to both build and serve the app. If you would rather not build on the box, build locally and rsync `dist/` to any web root — Caddy/nginx/whatever.

### One-time server setup

```bash
ssh root@<server-ip>
apt-get update && apt-get install -y docker.io docker-compose-v2 git
# Optional but recommended on a 2 GB box: 2 GB swap so the Vite build can't OOM.
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Open ports 80 and 443 in the Hetzner Cloud firewall (or `ufw allow 80,443/tcp`).

### Deploy

```bash
git clone https://github.com/alejodosr/the-extraction-capitalism-simulator /opt/the-extraction && cd /opt/the-extraction
# For automatic HTTPS, point an A record at the server, then:
echo "DOMAIN=the-extraction.example.com" > .env
docker compose up -d --build
```

Without a `DOMAIN`, Caddy listens on `:80` and the app is reachable at `http://<server-ip>`. With one set, Caddy provisions a Let's Encrypt cert on first request and redirects HTTP → HTTPS.

### Updating

```bash
cd /opt/the-extraction && git pull && docker compose up -d --build
```

The `caddy_data` volume persists certificates across rebuilds, so renewals survive deploys.
