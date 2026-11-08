import type { Currency, Investment, PortfolioData, Valuation } from "./domain";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid portfolio record.");
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) throw new Error(`Invalid ${field}.`);
  return value;
}
function numeric(value: unknown, field: string, minimum = -Infinity): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) throw new Error(`Invalid ${field}.`);
  return value;
}
function currency(value: unknown): Currency {
  if (value !== "EUR" && value !== "INR") throw new Error("Invalid currency.");
  return value;
}
function date(value: unknown, field: string, allowEmpty = false): string {
  const result = text(value, field, allowEmpty);
  if (result === "" && allowEmpty) return result;
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(result) || !Number.isFinite(Date.parse(result))) throw new Error(`Invalid ${field}.`);
  const day = result.slice(0, 10);
  if (new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) throw new Error(`Invalid ${field}.`);
  return result;
}

/** Accepts the original v1 export; drops extra fields and rejects malformed records before replacing local data. */
export function parsePortfolioExport(content: string): PortfolioData {
  const data = record(JSON.parse(content));
  if (data.version !== 1 || !Array.isArray(data.investments) || !Array.isArray(data.valuations)) throw new Error("Not an Aster portfolio export.");
  const investments: Investment[] = data.investments.map((value: unknown) => {
    const item = record(value);
    return { id: text(item.id, "investment ID"), name: text(item.name, "investment name"), category: text(item.category, "category"), currency: currency(item.currency), expectedAnnualReturn: numeric(item.expectedAnnualReturn, "annual return", -100), createdAt: date(item.createdAt, "created date"), ...(item.updatedAt === undefined ? {} : { updatedAt: date(item.updatedAt, "updated date") }) };
  });
  const ids = new Set(investments.map((item) => item.id));
  if (ids.size !== investments.length) throw new Error("Duplicate investment IDs.");
  const valuations: Valuation[] = data.valuations.map((value: unknown) => {
    const item = record(value);
    const investmentId = text(item.investmentId, "investment ID");
    if (!ids.has(investmentId)) throw new Error("Valuation refers to a missing investment.");
    const eurInrRate = numeric(item.eurInrRate, "valuation FX rate", 0);
    if (!eurInrRate) throw new Error("Valuation FX rate must be positive.");
    return { id: text(item.id, "valuation ID"), investmentId, amount: numeric(item.amount, "valuation amount", 0), currency: currency(item.currency), eurInrRate, valuedAt: date(item.valuedAt, "valuation date"), note: text(item.note, "note", true), createdAt: date(item.createdAt, "created date"), ...(item.updatedAt === undefined ? {} : { updatedAt: date(item.updatedAt, "updated date") }) };
  });
  if (new Set(valuations.map((item) => item.id)).size !== valuations.length) throw new Error("Duplicate valuation IDs.");
  return { version: 1, investments, valuations, lastFxRate: numeric(data.lastFxRate, "FX rate", 0), lastFxDate: date(data.lastFxDate, "FX date", true), dataUpdatedAt: date(data.dataUpdatedAt ?? "", "updated date", true) };
}
