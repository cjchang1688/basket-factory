import YahooFinance from "yahoo-finance2";
import { NextRequest } from "next/server";

const yf = new YahooFinance();

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return Response.json({ error: "symbol required" }, { status: 400 });
  }

  const period2 = new Date();
  const period1 = new Date(period2);
  period1.setFullYear(period1.getFullYear() - 1);

  try {
    const [history, quote] = await Promise.all([
      yf.historical(
        symbol,
        { period1, period2, interval: "1d" },
        { validateResult: false }
      ),
      yf.quote(symbol, undefined, { validateResult: false }),
    ]);

    const prices = (history as Array<{ date: Date; close: number }>)
      .filter((r) => r.close != null)
      .map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        close: r.close,
      }));

    const closes = prices.map((p) => p.close);
    const fiftyTwoWeekLow = closes.length ? Math.min(...closes) : 0;
    const fiftyTwoWeekHigh = closes.length ? Math.max(...closes) : 0;
    const currentPrice =
      (quote as { regularMarketPrice?: number }).regularMarketPrice ??
      closes[closes.length - 1] ??
      0;

    return Response.json(
      { symbol, prices, fiftyTwoWeekLow, fiftyTwoWeekHigh, currentPrice },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
