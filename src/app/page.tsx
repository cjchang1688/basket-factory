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

function bsPut(
  S: number,
  K: number,
  dtedays: number,
  ivPct: number,
  r = 0.05
): number {
  const T = dtedays / 365;
  const sigma = ivPct / 100;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0)
    return Math.max(K - S, 0);
  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
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

  // CSP calc
  const [cspSymbol, setCspSymbol] = useState<string>("");
  const [cash, setCash] = useState(10000);
  const [strikePct, setStrikePct] = useState(90);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [dte, setDte] = useState<number>(30);
  const [minDate, setMinDate] = useState<string>("");
  const [iv, setIv] = useState(30);

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

  // Reset history when CSP symbol changes
  useEffect(() => {
    setHistoryData(null);
    setSupportLevels([]);
  }, [cspSymbol]);

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

  // CSP math
  const stockPrice = cspSymbol ? (quotes[cspSymbol]?.price ?? 0) : 0;
  const strike = stockPrice * (strikePct / 100);
  const premium = stockPrice > 0 ? bsPut(stockPrice, strike, dte, iv) : 0;
  const contracts = strike > 0 ? Math.floor(cash / (strike * 100)) : 0;
  const totalPremium = contracts * premium * 100;
  const breakeven = strike - premium;
  const yieldPct = cash > 0 ? (totalPremium / cash) * 100 : 0;
  const annualizedYield = dte > 0 ? yieldPct * (365 / dte) : 0;

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
            Cash-secured put — estimated premium via Black-Scholes
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Holding
              </label>
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
              <label className="text-xs text-zinc-400 block mb-1.5">
                Cash ($)
              </label>
              <input
                type="number"
                value={cash}
                min={0}
                onChange={(e) => setCash(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Strike % of price
              </label>
              <input
                type="number"
                value={strikePct}
                min={50}
                max={105}
                onChange={(e) => setStrikePct(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationDate}
                min={minDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
              />
              <p className="text-xs text-zinc-500 mt-1">{dte} days</p>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                IV %
              </label>
              <input
                type="number"
                value={iv}
                min={1}
                onChange={(e) => setIv(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {stockPrice > 0 ? (
            <>
              {/* Price chart */}
              <div className="mb-5">
                <CspChart
                  symbol={cspSymbol}
                  currentPrice={stockPrice}
                  strikePrice={strike}
                  onDataLoaded={(d, s) => {
                    setHistoryData(d);
                    setSupportLevels(s);
                  }}
                />
              </div>

              {/* Chart context metrics */}
              {historyData && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mb-5 text-xs text-zinc-400">
                  <span>
                    Strike{" "}
                    <span className="text-amber-400 font-mono">
                      {fmtPct(((strike / stockPrice) - 1) * 100)}
                    </span>{" "}
                    vs current
                  </span>
                  <span>
                    Strike{" "}
                    <span className="text-emerald-400 font-mono">
                      {fmtPct(((strike / historyData.fiftyTwoWeekLow) - 1) * 100)}
                    </span>{" "}
                    above 52W low
                  </span>
                  {supportLevels.length > 0 && (() => {
                    const nearest = supportLevels.reduce((a, b) =>
                      Math.abs(b - strike) < Math.abs(a - strike) ? b : a
                    );
                    const cushion = strike - nearest;
                    return cushion > 0 ? (
                      <span>
                        Cushion to support:{" "}
                        <span className="text-blue-400 font-mono">
                          {fmtUsd(cushion)} ({fmt((cushion / strike) * 100)}%)
                        </span>
                      </span>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Yield stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Current price" value={fmtUsd(stockPrice)} />
                <Stat
                  label="Strike"
                  value={fmtUsd(strike)}
                  sub={`${strikePct}% of spot`}
                />
                <Stat
                  label="Contracts"
                  value={String(contracts)}
                  sub={`${fmtUsd(strike * 100 * contracts)} secured`}
                />
                <Stat label="Premium / share" value={fmtUsd(premium)} />
                <Stat label="Total premium" value={fmtUsd(totalPremium)} />
                <Stat
                  label="Break-even"
                  value={fmtUsd(breakeven)}
                  sub={
                    fmtPct(((breakeven - stockPrice) / stockPrice) * 100) +
                    " vs spot"
                  }
                />
                <Stat label="Yield on cash" value={fmt(yieldPct) + "%"} />
                <Stat
                  label="Annualized yield"
                  value={fmt(annualizedYield) + "%"}
                  highlight
                />
                <Stat
                  label="Max profit"
                  value={fmtUsd(totalPremium)}
                  sub="expires worthless"
                />
              </div>
            </>
          ) : (
            <p className="text-zinc-500 text-sm">
              {loading
                ? "Fetching price…"
                : "Live quote needed — select a holding above."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
