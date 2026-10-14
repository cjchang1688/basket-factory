import YahooFinance from "yahoo-finance2";
import { NextRequest } from "next/server";

const yf = new YahooFinance();

// YTD base = last trading close on or before Dec 31 2024
const YTD_P1 = new Date("2024-12-26");
const YTD_P2 = new Date("2025-01-02"); // exclusive upper bound for filtering

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!symbols.length) return Response.json({});

  const [quoteResults, ytdResults] = await Promise.all([
    Promise.allSettled(
      symbols.map((s) => yf.quote(s, undefined, { validateResult: false }))
    ),
    Promise.allSettled(
      symbols.map((s) =>
        yf.historical(
          s,
          { period1: YTD_P1, period2: YTD_P2, interval: "1d" },
          { validateResult: false }
        )
      )
    ),
  ]);

  type QuoteFields = {
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
  };

  const data: Record<
    string,
    {
      price: number;
      change: number;
      changePercent: number;
      high52w: number;
      low52w: number;
      ytdBase: number;
    }
  > = {};

  quoteResults.forEach((r, i) => {
    if (r.status !== "fulfilled" || !r.value) return;
    const q = r.value as QuoteFields;

    const ytdRow = ytdResults[i];
    const ytdBase =
      ytdRow.status === "fulfilled"
        ? ((ytdRow.value as Array<{ date: Date; close: number }>)
            .filter((row) => row.close != null && row.date < YTD_P2)
            .at(-1)?.close ?? 0)
        : 0;

    data[symbols[i]] = {
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      high52w: q.fiftyTwoWeekHigh ?? 0,
      low52w: q.fiftyTwoWeekLow ?? 0,
      ytdBase,
    };
  });

  return Response.json(data);
}
