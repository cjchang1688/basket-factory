# Basket Factory

Thematic basket builder for the **SPAXX + CSP wheel** strategy. Pick a basket, see live prices, and calculate cash-secured put premiums against a 52-week price chart.

## What it does

- **7 pre-built baskets** — Face Computer, Defense, Nuclear, Memory, Energy, Semi Chips, Healthcare
- Each basket is picks-and-shovels, not logo chasing (own the frame maker, not the glasses brand)
- **Live quotes** fetched from Yahoo Finance on basket selection
- **CSP Calculator** — enter cash, strike %, DTE, and IV to get Black-Scholes put premium, contracts, yield, and annualized return
- **52-week price chart** with strike line, 52W low, computed support levels, and a downside cushion zone

---

## Project structure

```
basket-factory/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── quotes/route.ts   # GET /api/quotes?symbols=QCOM,META,...
│   │   │   └── history/route.ts  # GET /api/history?symbol=QCOM
│   │   ├── page.tsx              # Main page (client component)
│   │   ├── layout.tsx            # Root layout + metadata
│   │   └── globals.css           # Tailwind v4 base styles
│   ├── components/
│   │   └── CspChart.tsx          # Recharts 52-week chart with reference lines
│   └── config/
│       └── baskets.ts            # Basket + holding definitions (source of truth)
├── ecosystem.config.js           # PM2 process config
├── next.config.ts                # Next.js 16 config (Turbopack, partial prefetch)
└── package.json
```

### Key files

**`src/config/baskets.ts`**
All basket data lives here. Each `Holding` has a `symbol` (display/chart ticker), `putTarget` (liquid US options ticker), `weight`, `role`, and `thesis`. Add or edit baskets here — the UI picks them up automatically.

**`src/app/api/quotes/route.ts`**
Accepts `?symbols=A,B,C`. Returns `{ [symbol]: { price, change, changePercent } }`. Uses `Promise.allSettled` so a single bad ticker doesn't break the response.

**`src/app/api/history/route.ts`**
Accepts `?symbol=X`. Returns 1 year of daily closes plus `fiftyTwoWeekLow`, `fiftyTwoWeekHigh`, and `currentPrice`. Cached for 1 hour via `Cache-Control: public, max-age=3600`.

**`src/components/CspChart.tsx`**
Self-contained chart component. Fetches its own history, computes support levels from local minima clustered within 2%, falls back to simulated price data if the fetch fails. Exposes `onDataLoaded(data, supportLevels)` so the parent can read 52W metrics without re-fetching.

**`src/app/page.tsx`**
Single-page client component. Owns all interactive state: basket selection, quotes, CSP inputs, and the history data surfaced from `CspChart`. No server components needed — the page is fully interactive.

---

## API reference

### `GET /api/quotes?symbols=QCOM,META`

```json
{
  "QCOM": { "price": 174.43, "change": -1.07, "changePercent": -0.61 },
  "META": { "price": 742.96, "change": 24.29, "changePercent": 3.38 }
}
```

Missing or errored symbols are silently omitted.

### `GET /api/history?symbol=QCOM`

```json
{
  "symbol": "QCOM",
  "prices": [
    { "date": "2025-10-13", "close": 161.78 },
    { "date": "2026-10-12", "close": 174.43 }
  ],
  "fiftyTwoWeekLow": 124.07,
  "fiftyTwoWeekHigh": 251.02,
  "currentPrice": 174.43
}
```

Cached 1 hour. Returns ~252 trading days.

---

## Development workflow

```bash
# Install dependencies
npm install

# Run dev server (port 3001, Turbopack)
npm run dev -- --port 3001

# production build
npm run build
npm start

# Type check
npx tsc --noEmit

# Lint
#npm run lint
```

---

## Production with PM2

The app runs under PM2 as `basket-factory` on port 3001.

```bash
# First deploy: build then start
npm run deploy          # = npm run build && pm2 start ecosystem.config.js

# Day-to-day
npm run pm2:restart     # restart after a rebuild
npm run pm2:reload      # zero-downtime reload
npm run pm2:stop        # stop
npm run pm2:logs        # tail logs
npm run pm2:status      # process table

# Survive reboots
pm2 save                # write process list to disk
pm2 startup             # print the systemd/init.d command to run once
```

After any code change:

```bash
npm run build && npm run pm2:restart
```

---

## Adding a basket

Edit `src/config/baskets.ts`. Add a new key to `BASKETS`:

```ts
"my-basket": {
  id: "my-basket",
  name: "My Basket",
  emoji: "🚀",
  thesis: "One sentence why.",
  thesisLong: "Longer explanation.",
  scenarioTicker: "NVDA",       // used for -30% stress test context
  holdings: [
    {
      symbol: "NVDA",           // TradingView / Yahoo ticker
      display: "Nvidia",
      weight: 30,               // must sum to 100 across holdings
      role: "GPU King",
      thesis: "AI training monopoly",
      putTarget: "NVDA",        // liquid US options ticker (may differ for foreign stocks)
    },
    // ...
  ],
},
```

The dropdown, holdings table, quote fetch, and CSP calculator all update automatically.

---

## CSP calculator notes

- Premium is estimated via **Black-Scholes** (Abramowitz & Stegun normal CDF approximation)
- IV is user-supplied — check the options chain for the actual implied vol
- `putTarget` is the ticker used for both the live quote and the CSP calc; for foreign-listed stocks (e.g. Samsung `005930.KS`) the putTarget is the US OTC ticker (`SSNLF`)
- Strike % is relative to the live quote price, not a specific options strike
