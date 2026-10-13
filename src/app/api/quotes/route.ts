import YahooFinance from "yahoo-finance2";
import { NextRequest } from "next/server";

const yf = new YahooFinance();

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!symbols.length) return Response.json({});

  const results = await Promise.allSettled(
    symbols.map((s) =>
      yf.quote(s, undefined, { validateResult: false })
    )
  );

  const data: Record<
    string,
    { price: number; change: number; changePercent: number }
  > = {};

  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      const q = r.value;
      data[symbols[i]] = {
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
      };
    }
  });

  return Response.json(data);
}
