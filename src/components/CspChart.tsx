"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

export type PricePoint = { date: string; close: number };

export type HistoryData = {
  symbol: string;
  prices: PricePoint[];
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  currentPrice: number;
};

export type CspChartProps = {
  symbol: string;
  currentPrice: number;
  strikePrice: number;
  supportLevels?: number[];
  onDataLoaded?: (data: HistoryData, supports: number[]) => void;
};

type SupportZone = { min: number; max: number; count: number };

// Merge support levels that are within 5% of each other (by price ratio) into zones
function groupSupportZones(levels: number[]): SupportZone[] {
  const sorted = [...levels].sort((a, b) => a - b);
  const zones: SupportZone[] = [];
  for (const lvl of sorted) {
    const last = zones[zones.length - 1];
    if (last && (lvl - last.max) / lvl < 0.05) {
      last.max = lvl;
      last.count++;
    } else {
      zones.push({ min: lvl, max: lvl, count: 1 });
    }
  }
  return zones;
}

// Find local minima, cluster within 2%, return up to 3 most recent levels
function getSupportLevels(prices: number[]): number[] {
  const minima: Array<{ price: number; idx: number }> = [];
  for (let i = 1; i < prices.length - 1; i++) {
    if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
      minima.push({ price: prices[i], idx: i });
    }
  }

  const clusters: Array<{ sum: number; count: number; lastIdx: number }> = [];
  for (const m of minima) {
    const c = clusters.find((cl) => {
      const avg = cl.sum / cl.count;
      return Math.abs(avg - m.price) / avg < 0.02;
    });
    if (c) {
      c.sum += m.price;
      c.count++;
      c.lastIdx = Math.max(c.lastIdx, m.idx);
    } else {
      clusters.push({ sum: m.price, count: 1, lastIdx: m.idx });
    }
  }

  return clusters
    .sort((a, b) => b.lastIdx - a.lastIdx)
    .slice(0, 3)
    .map((c) => c.sum / c.count);
}

function makeMockData(currentPrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  const end = new Date();
  let price = currentPrice * 0.88;

  while (d <= end) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      price *= 1 + (Math.random() - 0.487) * 0.018;
      points.push({
        date: new Date(d).toISOString().slice(0, 10),
        close: parseFloat(price.toFixed(2)),
      });
    }
    d.setDate(d.getDate() + 1);
  }

  if (points.length) {
    const scale = currentPrice / points[points.length - 1].close;
    points.forEach((p) => {
      p.close = parseFloat((p.close * scale).toFixed(2));
    });
  }
  return points;
}

function CustomTooltip({
  active,
  payload,
  strikePrice,
}: {
  active?: boolean;
  payload?: Array<{ payload: PricePoint }>;
  strikePrice: number;
}) {
  if (!active || !payload?.length) return null;
  const { date, close } = payload[0].payload;
  const distPct = strikePrice > 0 ? ((close / strikePrice - 1) * 100).toFixed(1) : "—";
  const above = close >= strikePrice;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-zinc-400 mb-1">{date}</p>
      <p className="text-zinc-100 font-mono font-semibold">${close.toFixed(2)}</p>
      {strikePrice > 0 && (
        <p className={above ? "text-emerald-400" : "text-red-400"}>
          {(above ? "+" : "") + distPct}% vs strike
        </p>
      )}
    </div>
  );
}

function SupportLabel({
  viewBox,
  value,
  side,
}: {
  viewBox?: { x: number; y: number; width: number; height: number };
  value?: string;
  side?: "left" | "right";
}) {
  if (!viewBox || !value) return null;
  const { x, y, width } = viewBox;
  const isRight = side === "right";
  const charW = 6.2;
  const padH = 5;
  const textW = value.length * charW;
  const boxW = textW + padH * 2;
  const boxH = 15;
  const textX = isRight ? x + width - 8 : x + 8;
  const boxX = isRight ? textX - textW - padH : textX - padH;

  return (
    <g>
      <rect
        x={boxX}
        y={y - boxH / 2}
        width={boxW}
        height={boxH}
        rx={3}
        fill="#18181b"
        fillOpacity={0.92}
        stroke="#3b82f6"
        strokeWidth={0.5}
        strokeOpacity={0.5}
      />
      <text
        x={textX}
        y={y + 4}
        fill="#60a5fa"
        fontSize={10}
        textAnchor={isRight ? "end" : "start"}
        fontFamily="ui-monospace, monospace"
      >
        {value}
      </text>
    </g>
  );
}

export function CspChart({
  symbol,
  currentPrice,
  strikePrice,
  supportLevels: propSupportLevels,
  onDataLoaded,
}: CspChartProps) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setIsMock(false);

    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? (r.json() as Promise<HistoryData>) : Promise.reject(r.status)))
      .then((d) => {
        setData(d);
        setLoading(false);
        if (onDataLoaded) {
          onDataLoaded(d, getSupportLevels(d.prices.map((p) => p.close)));
        }
      })
      .catch(() => {
        const mockPrices = makeMockData(currentPrice || 100);
        const closes = mockPrices.map((p) => p.close);
        const mock: HistoryData = {
          symbol,
          prices: mockPrices,
          fiftyTwoWeekLow: Math.min(...closes),
          fiftyTwoWeekHigh: Math.max(...closes),
          currentPrice: currentPrice || closes[closes.length - 1],
        };
        setData(mock);
        setIsMock(true);
        setLoading(false);
        if (onDataLoaded) {
          onDataLoaded(mock, getSupportLevels(closes));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-[280px] md:h-[280px] rounded-lg bg-zinc-800/40 animate-pulse flex items-center justify-center">
        <span className="text-zinc-600 text-sm">Loading chart…</span>
      </div>
    );
  }

  if (!data?.prices.length) return null;

  const closes = data.prices.map((p) => p.close);
  const supports = propSupportLevels ?? getSupportLevels(closes);

  const allY = [
    ...closes,
    strikePrice > 0 ? strikePrice : null,
    data.fiftyTwoWeekLow,
  ].filter((v): v is number => v != null);
  const yMin = Math.min(...allY) * 0.9;
  const yMax = Math.max(...allY) * 1.1;

  const monthTicks = data.prices
    .filter((p, i) => i === 0 || p.date.slice(5, 7) !== data.prices[i - 1].date.slice(5, 7))
    .map((p) => p.date);

  const strikeOffPct =
    strikePrice > 0 && currentPrice > 0
      ? ((strikePrice / currentPrice - 1) * 100).toFixed(1)
      : "—";

  return (
    <div>
      <div className="h-[200px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data.prices}
            margin={{ top: 8, right: 80, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={monthTicks}
              tickFormatter={(d: string) =>
                new Date(d + "T12:00:00Z").toLocaleString("en-US", { month: "short" })
              }
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={52}
            />
            <Tooltip
              content={<CustomTooltip strikePrice={strikePrice} />}
            />

            {/* Downside cushion zone */}
            {currentPrice > strikePrice && strikePrice > 0 && (
              <ReferenceArea
                y1={strikePrice}
                y2={currentPrice}
                fill="#f59e0b"
                fillOpacity={0.07}
                stroke="none"
              />
            )}

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#e5e5e5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#e5e5e5", stroke: "none" }}
            />

            {/* Strike */}
            {strikePrice > 0 && (
              <ReferenceLine
                y={strikePrice}
                stroke="#f59e0b"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Your Strike $${strikePrice.toFixed(0)} (${strikeOffPct}%)`,
                  position: "insideTopRight",
                  fill: "#f59e0b",
                  fontSize: 10,
                }}
              />
            )}

            {/* 52-week low */}
            <ReferenceLine
              y={data.fiftyTwoWeekLow}
              stroke="#22c55e"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `52W Low $${data.fiftyTwoWeekLow.toFixed(0)}`,
                position: "insideBottomRight",
                fill: "#22c55e",
                fontSize: 10,
              }}
            />

            {/* Support levels — clustered into zones to prevent label overlap */}
            {groupSupportZones(supports).flatMap((zone, i) => {
              const side = i % 2 === 0 ? "left" : "right";
              if (zone.count === 1) {
                return [
                  <ReferenceLine
                    key={`sup-${i}`}
                    y={zone.min}
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={<SupportLabel value={`Support $${zone.min.toFixed(0)}`} side={side} />}
                  />,
                ];
              }
              return [
                <ReferenceArea
                  key={`zone-area-${i}`}
                  y1={zone.min}
                  y2={zone.max}
                  fill="#3b82f6"
                  fillOpacity={0.08}
                  stroke="#3b82f6"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />,
                <ReferenceLine
                  key={`zone-label-${i}`}
                  y={(zone.min + zone.max) / 2}
                  stroke="none"
                  label={
                    <SupportLabel
                      value={`Zone $${zone.min.toFixed(0)}–$${zone.max.toFixed(0)}`}
                      side={side}
                    />
                  }
                />,
              ];
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {isMock && (
        <p className="text-[10px] text-zinc-600 mt-1 text-center">
          ⚠ Simulated price history — live fetch failed
        </p>
      )}
    </div>
  );
}
