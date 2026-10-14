"use client";

import { useState, useEffect } from "react";
import {
  BASKETS,
  BASKET_IDS,
  DEFAULT_BASKET_ID,
  type Holding,
} from "@/config/baskets";
import { CspChart, type HistoryData } from "@/components/CspChart";

type QuoteData = { price: number; change: number; changePercent: number };
type Quotes = Record<string, QuoteData>;

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

function Stat({
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
    <div className="bg-zinc-800/60 rounded-lg p-3">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p
        className={`text-base font-mono font-semibold ${
          highlight ? "text-emerald-400" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

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

function HoldingRow({
  holding,
  quote,
}: {
  holding: Holding;
  quote: QuoteData | undefined;
}) {
  const pctColor =
    quote == null
      ? "text-zinc-600"
      : quote.changePercent >= 0
      ? "text-emerald-400"
      : "text-red-400";

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
        {quote ? fmtUsd(quote.price) : <span className="text-zinc-600">—</span>}
      </td>
      <td className={`py-3 text-right font-mono text-xs ${pctColor}`}>
        {quote ? fmtPct(quote.changePercent) : "—"}
      </td>
    </tr>
  );
}

export default function Home() {
  const [basketId, setBasketId] = useState(DEFAULT_BASKET_ID);
  const [quotes, setQuotes] = useState<Quotes>({});
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // CSP calc inputs — stored as strings to prevent React's reconciliation bail-out
  // when a number parses identically (e.g. "06.90" → 6.9 === 6.9, no re-render).
  // Derived numbers are computed below for all math.
  const [cspSymbol, setCspSymbol] = useState<string>("");
  const [strikePriceStr, setStrikePriceStr] = useState<string>("0");
  const [numContractsStr, setNumContractsStr] = useState<string>("1");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [dte, setDte] = useState<number>(30);
  const [minDate, setMinDate] = useState<string>("");
  const [premiumStr, setPremiumStr] = useState<string>("0");
  const [spaxxStr, setSpaxxStr] = useState<string>("4.96");

  const strikePrice = parseFloat(strikePriceStr) || 0;
  const numContracts = Math.max(1, parseInt(numContractsStr, 10) || 1);
  const premium = parseFloat(premiumStr) || 0;
  const spaxx = parseFloat(spaxxStr) || 0;

  // History data surfaced from CspChart via onDataLoaded
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [supportLevels, setSupportLevels] = useState<number[]>([]);

  const basket = BASKETS[basketId];

  useEffect(() => {
    const symbols = [
      ...new Set(basket.holdings.map((h) => h.putTarget)),
    ].join(",");
    setLoading(true);
    setQuoteError(null);
    setStrikePriceStr("0");
    setPremiumStr("0");
    fetch(`/api/quotes?symbols=${symbols}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Quotes>;
      })
      .then((data) => {
        setQuotes(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setQuoteError(e.message);
        setLoading(false);
      });
    setCspSymbol(basket.holdings[0]?.putTarget ?? "");
    setHistoryData(null);
    setSupportLevels([]);
  }, [basketId]);

  // Auto-set strike to 90% of price when symbol or quotes change
  useEffect(() => {
    const price = quotes[cspSymbol]?.price;
    if (price && price > 0) {
      setStrikePriceStr(String(Math.round(price * 0.9 * 2) / 2));
      setPremiumStr("0");
    }
    setHistoryData(null);
    setSupportLevels([]);
  }, [cspSymbol, quotes]);

  // Initialize expiration date and minDate on mount (must be client-side only)
  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const tom = new Date(t);
    tom.setDate(tom.getDate() + 1);
    setMinDate(toLocalDateString(tom));
    const d = new Date(t);
    d.setDate(d.getDate() + 30);
    const initialDate = toLocalDateString(d);
    setExpirationDate(initialDate);
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

  // CSP math (derived)
  const stockPrice = cspSymbol ? (quotes[cspSymbol]?.price ?? 0) : 0;
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
                    value={cspSymbol}
                    onChange={(e) => setCspSymbol(e.target.value)}
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
                    {loading ? (
                      <span className="text-zinc-600 animate-pulse">Loading…</span>
                    ) : stockPrice > 0 ? (
                      fmtUsd(stockPrice)
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">Strike Price</label>
                  <input
                    type="number"
                    value={strikePriceStr}
                    min={0}
                    step={0.5}
                    onChange={(e) => setStrikePriceStr(e.target.value)}
                    onBlur={(e) => setStrikePriceStr(String(parseFloat(e.target.value) || 0))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5"># Contracts</label>
                  <input
                    type="number"
                    value={numContractsStr}
                    min={1}
                    step={1}
                    onChange={(e) => setNumContractsStr(e.target.value)}
                    onBlur={(e) => setNumContractsStr(String(Math.max(1, parseInt(e.target.value, 10) || 1)))}
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
                    value={premiumStr}
                    min={0}
                    step={0.01}
                    onChange={(e) => setPremiumStr(e.target.value)}
                    onBlur={(e) => setPremiumStr((parseFloat(e.target.value) || 0).toFixed(2))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">SPAXX rate (%)</label>
                  <input
                    type="number"
                    value={spaxxStr}
                    min={0}
                    step={0.1}
                    onChange={(e) => setSpaxxStr(e.target.value)}
                    onBlur={(e) => setSpaxxStr(String(parseFloat(e.target.value) || 0))}
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
                  symbol={cspSymbol}
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
