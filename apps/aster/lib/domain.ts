export type Currency = "EUR" | "INR";

export interface Investment {
  id: string;
  name: string;
  category: string;
  currency: Currency;
  expectedAnnualReturn: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Valuation {
  id: string;
  investmentId: string;
  amount: number;
  currency: Currency;
  eurInrRate: number;
  valuedAt: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioData {
  version: 1;
  investments: Investment[];
  valuations: Valuation[];
  lastFxRate: number;
  lastFxDate: string;
  dataUpdatedAt: string;
}

export interface VaultCredentials {
  vaultId: string;
  vaultKey: string;
  revision: number;
  updatedAt: string;
}

export const EMPTY_PORTFOLIO: PortfolioData = {
  version: 1,
  investments: [],
  valuations: [],
  lastFxRate: 0,
  lastFxDate: "",
  dataUpdatedAt: "",
};

export function normalizePortfolioData(data: PortfolioData): PortfolioData {
  const historicalDates = [
    ...data.investments.map((item) => item.createdAt),
    ...data.valuations.map((item) => item.createdAt),
    data.lastFxDate,
  ].filter(Boolean);

  return {
    ...data,
    dataUpdatedAt:
      data.dataUpdatedAt ??
      historicalDates.sort((left, right) => left.localeCompare(right)).at(-1) ??
      "",
  };
}

export function latestValuation(
  data: PortfolioData,
  investmentId: string,
): Valuation | undefined {
  return data.valuations
    .filter((item) => item.investmentId === investmentId)
    .sort(compareValuationsNewestFirst)[0];
}

function compareValuationsNewestFirst(
  left: Valuation,
  right: Valuation,
): number {
  return (
    right.valuedAt.localeCompare(left.valuedAt) ||
    (right.updatedAt ?? right.createdAt).localeCompare(
      left.updatedAt ?? left.createdAt,
    ) ||
    right.id.localeCompare(left.id)
  );
}

export function amountInCurrency(
  amount: number,
  source: Currency,
  target: Currency,
  eurInrRate: number,
): number {
  if (source === target) return amount;
  if (eurInrRate <= 0) return 0;
  return source === "EUR" ? amount * eurInrRate : amount / eurInrRate;
}

export function portfolioValue(
  data: PortfolioData,
  currency: Currency,
  rate = data.lastFxRate,
): number {
  return data.investments.reduce((total, investment) => {
    const latest = latestValuation(data, investment.id);
    if (!latest) return total;
    const fx = rate > 0 ? rate : latest.eurInrRate;
    return total + amountInCurrency(latest.amount, latest.currency, currency, fx);
  }, 0);
}

export function investmentGrowth(
  data: PortfolioData,
  investmentId: string,
): number | null {
  const entries = investmentTimeline(data, investmentId, "EUR");
  if (entries.length < 2) return null;
  const first = entries[0].value;
  const last = entries.at(-1)!.value;
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

export function portfolioTimeline(
  data: PortfolioData,
  currency: Currency,
): Array<{ date: string; value: number }> {
  const dates = [...new Set(data.valuations.map((item) => item.valuedAt))].sort();
  return dates.map((date) => {
    let value = 0;
    for (const investment of data.investments) {
      const entry = data.valuations
        .filter(
          (item) =>
            item.investmentId === investment.id && item.valuedAt <= date,
        )
        .sort(compareValuationsNewestFirst)[0];
      if (entry) {
        value += amountInCurrency(
          entry.amount,
          entry.currency,
          currency,
          entry.eurInrRate,
        );
      }
    }
    return { date, value };
  });
}

export function investmentTimeline(
  data: PortfolioData,
  investmentId: string,
  currency: Currency,
): Array<{ date: string; value: number }> {
  const latestByDate = new Map<string, Valuation>();
  data.valuations
    .filter((item) => item.investmentId === investmentId)
    .sort(compareValuationsNewestFirst)
    .forEach((item) => {
      if (!latestByDate.has(item.valuedAt)) {
        latestByDate.set(item.valuedAt, item);
      }
    });

  return [...latestByDate.values()]
    .sort((left, right) => left.valuedAt.localeCompare(right.valuedAt))
    .map((item) => ({
      date: item.valuedAt,
      value: amountInCurrency(
        item.amount,
        item.currency,
        currency,
        item.eurInrRate,
      ),
    }));
}

export function projectedValue(
  data: PortfolioData,
  years: number,
  currency: Currency,
): number {
  return data.investments.reduce((total, investment) => {
    const latest = latestValuation(data, investment.id);
    if (!latest) return total;
    const current = amountInCurrency(
      latest.amount,
      latest.currency,
      currency,
      data.lastFxRate || latest.eurInrRate,
    );
    return (
      total +
      current * Math.pow(1 + investment.expectedAnnualReturn / 100, years)
    );
  }, 0);
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "EUR" ? "de-DE" : "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
