"use client";

import { useState, useEffect } from "react";
import {
  BASKETS,
  BASKET_IDS,
  DEFAULT_BASKET_ID,
  type Holding,
} from "@/config/baskets";
import { CspChart, type HistoryData } from "@/components/CspChart";

type QuoteData = {
  price: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  ytdBase: number;
};
type Quotes = Record<string, QuoteData>;

// Module-level 5-minute cache — survives re-renders, cleared on 60s refresh
const quoteCache = new Map<string, { data: QuoteData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchQuotes(symbols: string[]): Promise<Quotes> {
  const now = Date.now();
  const stale = symbols.filter((s) => {
    const c = quoteCache.get(s);
    return !c || now - c.ts > CACHE_TTL;
  });
  if (stale.length > 0) {
    const res = await fetch(`/api/quotes?symbols=${stale.join(",")}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fresh: Quotes = await res.json();
    for (const [sym, d] of Object.entries(fresh)) {
      quoteCache.set(sym, { data: d, ts: now });
    }
  }
  return Object.fromEntries(
    symbols
      .map((s) => [s, quoteCache.get(s)?.data] as const)
      .filter((entry): entry is [string, QuoteData] => entry[1] != null)
  );
}

// Abramowitz & Stegun normal CDF approximation
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t *
        (-0.35656378 +
          t * (1.78147794 + t * (-1.82125598 + t * 1.33027443))));
  return x > 0 ? 1 - p : p;
}

function bsPutRaw(S: number, K: number, T: number, sigma: number, r = 0.05): number {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return Math.max(K - S, 0);
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
}

function impliedVolatility(S: number, K: number, dtedays: number, marketPrice: number, r = 0.05): number {
  if (marketPrice <= 0 || S <= 0 || K <= 0 || dtedays <= 0) return 0;
  const T = dtedays / 365;
  let sigma = 0.3;
  for (let i = 0; i < 200; i++) {
    const price = bsPutRaw(S, K, T, sigma, r);
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const vega = S * sqrtT * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
    if (Math.abs(vega) < 1e-10) break;
    sigma = sigma - (price - marketPrice) / vega;
    sigma = Math.max(0.001, Math.min(sigma, 20));
    if (Math.abs(price - marketPrice) < 0.0001) break;
  }
  return Math.max(0, sigma * 100);
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const fmtUsd = (n: number) => "$" + fmt(n);

const fmtPct = (n: number) => (n >= 0 ? "+" : "") + fmt(n) + "%";

function ResultRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="py-2 first:pt-0">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-xs text-zinc-400 leading-tight">{label}</span>
        <span className={`font-mono text-sm font-semibold shrink-0 ${highlight ? "text-emerald-400" : "text-zinc-100"}`}>
          {value}
        </span>
      </div>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5 text-right">{sub}</p>}
    </div>
  );
}

function Skeleton({ w = "w-14" }: { w?: string }) {
  return (
    <span
      className={`inline-block align-middle ${w} h-3 rounded bg-zinc-700/80 animate-pulse`}
    />
  );
}

function HoldingRow({
  holding,
  quote,
}: {
  holding: Holding;
  quote: QuoteData | undefined;
}) {
  const dayColor =
    quote == null
      ? ""
      : quote.changePercent >= 0
      ? "text-emerald-400"
      : "text-red-400";

  const ytdPct =
    quote && quote.ytdBase > 0
      ? ((quote.price - quote.ytdBase) / quote.ytdBase) * 100
      : null;
  const offHigh =
    quote && quote.high52w > 0
      ? ((quote.price - quote.high52w) / quote.high52w) * 100
      : null;
  const upFromLow =
    quote && quote.low52w > 0
      ? ((quote.price - quote.low52w) / quote.low52w) * 100
      : null;

  return (
    <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/40">
      <td className="py-3 pr-4 font-mono text-blue-400 font-medium text-sm">
        {holding.putTarget}
      </td>
      <td className="py-3 pr-4 font-medium text-sm">{holding.display}</td>
      <td className="py-3 pr-4 text-right">
        <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">
          {holding.weight}%
        </span>
      </td>
      <td className="py-3 pr-4">
        <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded text-xs">
          {holding.role}
        </span>
      </td>
      <td className="py-3 pr-4 text-zinc-500 hidden md:table-cell text-xs max-w-[240px] truncate">
        {holding.thesis}
      </td>
      <td className="py-3 pr-4 text-right font-mono text-sm">
        {quote ? fmtUsd(quote.price) : <Skeleton w="w-16" />}
      </td>
      <td className={`py-3 pr-4 text-right font-mono text-xs ${dayColor}`}>
        {quote ? fmtPct(quote.changePercent) : <Skeleton />}
      </td>
      <td className={`py-3 pr-4 text-right font-mono text-xs ${ytdPct == null ? "" : ytdPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {ytdPct != null ? fmtPct(ytdPct) : <Skeleton />}
      </td>
      <td className={`py-3 pr-4 text-right font-mono text-xs ${offHigh != null ? "text-red-400" : ""}`}>
        {offHigh != null ? fmtPct(offHigh) : <Skeleton />}
      </td>
      <td className={`py-3 text-right font-mono text-xs ${upFromLow != null ? "text-emerald-400" : ""}`}>
        {upFromLow != null ? fmtPct(upFromLow) : <Skeleton />}
      </td>
    </tr>
  );
}

// CSP form — completely isolated from basket live-data refresh cycle
type CspForm = {
  holding: string;
  stockPrice: number; // persists across basket refreshes; updated on holding change
  strike: string;
  contracts: string;
  premium: string;
  spaxx: string;
};

const CSP_DEFAULTS: Omit<CspForm, "holding" | "stockPrice"> = {
  strike: "0",
  contracts: "1",
  premium: "0",
  spaxx: "4.96",
};

export default function Home() {
  const [basketId, setBasketId] = useState(DEFAULT_BASKET_ID);
  const [quotes, setQuotes] = useState<Quotes>({});
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [cspForm, setCspForm] = useState<CspForm>({
    holding: "",
    stockPrice: 0,
    ...CSP_DEFAULTS,
  });
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [dte, setDte] = useState<number>(30);
  const [minDate, setMinDate] = useState<string>("");
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [supportLevels, setSupportLevels] = useState<number[]>([]);

  const basket = BASKETS[basketId];

  // Basket switch: fetch all holdings, set initial CSP state on first load only
  useEffect(() => {
    const symbols = [...new Set(basket.holdings.map((h) => h.putTarget))];
    const firstTicker = basket.holdings[0]?.putTarget ?? "";

    setHistoryData(null);
    setSupportLevels([]);

    let cancelled = false;

    const doFetch = (showSkeleton: boolean) => {
      if (showSkeleton) {
        setLoading(true);
        setQuotes({});
        // Reset CSP form immediately so stale values don't flash
        setCspForm({ holding: firstTicker, stockPrice: 0, ...CSP_DEFAULTS });
      }
      setQuoteError(null);
      fetchQuotes(symbols)
        .then((data) => {
          if (cancelled) return;
          setQuotes(data);
          setLoading(false);
          // Auto-set CSP stock price + 90% strike — only on basket switch, never on refresh
          if (showSkeleton) {
            const price = data[firstTicker]?.price ?? 0;
            setCspForm((f) => ({
              ...f,
              stockPrice: price,
              strike: price > 0 ? String(Math.round(price * 0.9 * 2) / 2) : "0",
            }));
          }
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setQuoteError(e.message);
          setLoading(false);
        });
    };

    doFetch(true);

    // Background refresh every 60s — invalidates cache, no skeleton flash, no strike reset
    const timer = setInterval(() => {
      symbols.forEach((s) => quoteCache.delete(s));
      doFetch(false);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [basketId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Holding change in CSP: read price from cache (always pre-fetched by basket load),
  // update stockPrice in form, clear chart — never touch strike or other inputs
  const onCspHoldingChange = (ticker: string) => {
    setHistoryData(null);
    setSupportLevels([]);
    const cachedPrice = quoteCache.get(ticker)?.data.price;
    setCspForm((f) => ({
      ...f,
      holding: ticker,
      // Keep last known price if cache miss (shouldn't happen for basket tickers)
      stockPrice: cachedPrice ?? f.stockPrice,
    }));
  };

  // Initialize expiration date and minDate on mount (must be client-side only)
  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const tom = new Date(t);
    tom.setDate(tom.getDate() + 1);
    setMinDate(toLocalDateString(tom));
    const d = new Date(t);
    d.setDate(d.getDate() + 30);
    setExpirationDate(toLocalDateString(d));
    setDte(30);
  }, []);

  // Recompute DTE whenever expiration date changes
  useEffect(() => {
    if (!expirationDate) return;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const exp = new Date(expirationDate + "T00:00:00");
    setDte(Math.max(1, Math.ceil((exp.getTime() - t.getTime()) / 86400000)));
  }, [expirationDate]);

  // CSP derived values
  const strikePrice = parseFloat(cspForm.strike) || 0;
  const numContracts = Math.max(1, parseInt(cspForm.contracts, 10) || 1);
  const premium = parseFloat(cspForm.premium) || 0;
  const spaxx = parseFloat(cspForm.spaxx) || 0;
  // Live quotes take precedence; fall back to form's last-fetched price so the
  // field never goes blank during a background basket refresh (setQuotes({}) path)
  const stockPrice = quotes[cspForm.holding]?.price || cspForm.stockPrice;

  const cashNeeded = strikePrice > 0 ? strikePrice * 100 * numContracts : 0;
  const totalPremiumAmt = premium * 100 * numContracts;
  const breakeven = strikePrice > 0 ? strikePrice - premium : 0;
  const strikePctOfPrice = stockPrice > 0 && strikePrice > 0 ? (strikePrice / stockPrice) * 100 : 0;
  const iv = premium > 0 && stockPrice > 0 && strikePrice > 0
    ? impliedVolatility(stockPrice, strikePrice, dte, premium)
    : 0;
  const annualizedYield = cashNeeded > 0 && dte > 0
    ? (totalPremiumAmt / cashNeeded) * (365 / dte) * 100
    : 0;
  const yieldOnCash = annualizedYield + spaxx;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <h1 className="text-xl font-bold tracking-tight">🧺 Basket Factory</h1>
        <select
          value={basketId}
          onChange={(e) => setBasketId(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 cursor-pointer hover:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {BASKET_IDS.map((id) => (
            <option key={id} value={id}>
              {BASKETS[id].emoji} {BASKETS[id].name}
            </option>
          ))}
        </select>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Basket thesis */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-start gap-4">
            <span className="text-4xl shrink-0">{basket.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold">{basket.name}</h2>
              <p className="text-zinc-400 mt-1 font-medium italic">
                &ldquo;{basket.thesis}&rdquo;
              </p>
              <p className="text-zinc-500 mt-2 text-sm leading-relaxed">
                {basket.thesisLong}
              </p>
            </div>
          </div>
        </div>

        {/* Holdings table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Holdings</h3>
            <div className="text-sm">
              {loading && (
                <span className="text-zinc-500 animate-pulse">
                  Loading quotes…
                </span>
              )}
              {quoteError && (
                <span className="text-red-400">Error: {quoteError}</span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-left bg-zinc-900">
                  <th className="px-4 py-3 text-xs font-medium">Ticker</th>
                  <th className="px-4 py-3 text-xs font-medium">Name</th>
                  <th className="px-4 py-3 text-xs font-medium text-right">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-xs font-medium">Role</th>
                  <th className="px-4 py-3 text-xs font-medium hidden md:table-cell">
                    Thesis
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-right">
                    Price
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-right">
                    Day
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-right">
                    YTD %
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-right whitespace-nowrap">
                    % off 52W High
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-right whitespace-nowrap">
                    % up from 52W Low
                  </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-950">
                {basket.holdings.map((h) => (
                  <HoldingRow
                    key={h.symbol}
                    holding={h}
                    quote={quotes[h.putTarget]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CSP Calculator */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="text-lg font-semibold mb-1">CSP Calculator</h3>
          <p className="text-xs text-zinc-500 mb-5">
            Enter the market premium — IV and yields are back-calculated via Black-Scholes
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Inputs */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Holding</label>
                  <select
                    value={cspForm.holding}
                    onChange={(e) => onCspHoldingChange(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {basket.holdings.map((h) => (
                      <option key={h.putTarget} value={h.putTarget}>
                        {h.putTarget}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Stock Price</label>
                  <div className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 min-h-[38px] flex items-center">
                    {loading && stockPrice === 0 ? (
                      <Skeleton w="w-20" />
                    ) : stockPrice > 0 ? (
                      fmtUsd(stockPrice)
                    ) : (
                      <Skeleton w="w-20" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Strike Price</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cspForm.strike}
                    min={0}
                    step={0.5}
                    onChange={(e) =>
                      setCspForm((f) => ({ ...f, strike: e.target.value }))
                    }
                    onBlur={(e) =>
                      setCspForm((f) => ({
                        ...f,
                        strike: String(parseFloat(e.target.value) || 0),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5"># Contracts</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cspForm.contracts}
                    min={1}
                    step={1}
                    onChange={(e) =>
                      setCspForm((f) => ({ ...f, contracts: e.target.value }))
                    }
                    onBlur={(e) =>
                      setCspForm((f) => ({
                        ...f,
                        contracts: String(Math.max(1, parseInt(e.target.value, 10) || 1)),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    value={expirationDate}
                    min={minDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                  />
                  <p className="text-xs text-zinc-500 mt-1">{dte} days to expiration</p>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Premium / share ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cspForm.premium}
                    min={0}
                    step={0.01}
                    onChange={(e) =>
                      setCspForm((f) => ({ ...f, premium: e.target.value }))
                    }
                    onBlur={(e) =>
                      setCspForm((f) => ({
                        ...f,
                        premium: (parseFloat(e.target.value) || 0).toFixed(2),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">SPAXX rate (%)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cspForm.spaxx}
                    min={0}
                    step={0.1}
                    onChange={(e) =>
                      setCspForm((f) => ({ ...f, spaxx: e.target.value }))
                    }
                    onBlur={(e) =>
                      setCspForm((f) => ({
                        ...f,
                        spaxx: String(parseFloat(e.target.value) || 0),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Results card */}
            <div className="md:w-60 bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50 self-start shrink-0">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Results</p>
              <div className="divide-y divide-zinc-700/40">
                <ResultRow label="Strike % of price" value={strikePctOfPrice > 0 ? fmt(strikePctOfPrice) + "%" : "—"} />
                <ResultRow label="Implied Volatility" value={iv > 0 ? fmt(iv) + "%" : "—"} />
                <ResultRow label="Cash needed" value={cashNeeded > 0 ? fmtUsd(cashNeeded) : "—"} />
                <ResultRow label="Total premium" value={totalPremiumAmt > 0 ? fmtUsd(totalPremiumAmt) : "—"} />
                <ResultRow
                  label="Break-even"
                  value={breakeven > 0 ? fmtUsd(breakeven) : "—"}
                  sub={stockPrice > 0 && breakeven > 0 ? fmtPct(((breakeven - stockPrice) / stockPrice) * 100) + " vs spot" : undefined}
                />
                <ResultRow label="Annualized yield" value={annualizedYield > 0 ? fmt(annualizedYield) + "%" : "—"} />
                <ResultRow label="Yield on cash (incl. SPAXX)" value={annualizedYield > 0 ? fmt(yieldOnCash) + "%" : "—"} highlight />
              </div>
            </div>
          </div>

          {/* Chart — full width below inputs+results */}
          {stockPrice > 0 ? (
            <>
              <div className="mt-6">
                <CspChart
                  symbol={cspForm.holding}
                  currentPrice={stockPrice}
                  strikePrice={strikePrice}
                  onDataLoaded={(d, s) => {
                    setHistoryData(d);
                    setSupportLevels(s);
                  }}
                />
              </div>

              {historyData && strikePrice > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 pl-4 text-xs text-zinc-400">
                  <span>
                    Strike{" "}
                    <span className="text-amber-400 font-mono">
                      {fmtPct(((strikePrice / stockPrice) - 1) * 100)}
                    </span>{" "}
                    vs current
                  </span>
                  <span>
                    Strike{" "}
                    <span className="text-emerald-400 font-mono">
                      {fmtPct(((strikePrice / historyData.fiftyTwoWeekLow) - 1) * 100)}
                    </span>{" "}
                    above 52W low
                  </span>
                  {supportLevels.length > 0 && (() => {
                    const nearest = supportLevels.reduce((a, b) =>
                      Math.abs(b - strikePrice) < Math.abs(a - strikePrice) ? b : a
                    );
                    const cushion = strikePrice - nearest;
                    return cushion > 0 ? (
                      <span>
                        Cushion to support:{" "}
                        <span className="text-blue-400 font-mono">
                          {fmtUsd(cushion)} ({fmt((cushion / strikePrice) * 100)}%)
                        </span>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </>
          ) : (
            <p className="text-zinc-500 text-sm mt-4">
              {loading ? "Fetching price…" : "Live quote needed — select a holding above."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
