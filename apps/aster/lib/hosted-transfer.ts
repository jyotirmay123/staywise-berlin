import type { PortfolioData } from "./domain";
import { parsePortfolioExport } from "./portable-data.ts";

export const SOURCE_ORIGIN = "https://aster-portfolio-ledger.senapati-jyotirmay.chatgpt.site";
export const DESTINATION_URL = "https://jyotirmay123.github.io/staywise-berlin/apps/aster/";
export const DESTINATION_ORIGIN = new URL(DESTINATION_URL).origin;

export interface TransferCandidate {
  source: string;
  data: PortfolioData;
  savedAt: string;
}

export function isTransferNonce(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function createTransferMessage(nonce: string, data: PortfolioData) {
  if (!isTransferNonce(nonce)) throw new Error("Invalid transfer nonce.");
  return {
    type: "aster-transfer-v1" as const,
    nonce,
    payload: parsePortfolioExport(JSON.stringify(data)),
  };
}

export function parseTransferMessage(value: unknown, expectedNonce: string): PortfolioData | null {
  if (!isTransferNonce(expectedNonce) || !value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  if (message.type !== "aster-transfer-v1" || message.nonce !== expectedNonce) return null;
  try {
    return parsePortfolioExport(JSON.stringify(message.payload));
  } catch {
    return null;
  }
}

export function isTransferAcknowledgement(value: unknown, expectedNonce: string): boolean {
  if (!isTransferNonce(expectedNonce) || !value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return message.type === "aster-transfer-ack-v1" && message.nonce === expectedNonce;
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Content edit time wins over server save time, which may merely reflect an old snapshot being synced. */
export function snapshotUpdatedAt(candidate: TransferCandidate): string {
  if (timestamp(candidate.data.dataUpdatedAt)) return candidate.data.dataUpdatedAt;
  const dates = [
    ...candidate.data.investments.flatMap((item) => [item.createdAt, item.updatedAt ?? ""]),
    ...candidate.data.valuations.flatMap((item) => [item.createdAt, item.updatedAt ?? ""]),
  ].filter((value) => timestamp(value));
  return dates.sort((left, right) => timestamp(right) - timestamp(left))[0] ?? candidate.savedAt;
}

/** Select one complete snapshot. Never merge, because doing so could resurrect deleted records. */
export function selectSnapshot(candidates: TransferCandidate[]): TransferCandidate | null {
  const valid = candidates.flatMap((candidate) => {
    try {
      const data = parsePortfolioExport(JSON.stringify(candidate.data));
      if (!data.investments.length && !data.valuations.length && !timestamp(data.dataUpdatedAt)) return [];
      return [{ ...candidate, data }];
    } catch {
      return [];
    }
  });
  valid.sort((left, right) =>
    timestamp(snapshotUpdatedAt(right)) - timestamp(snapshotUpdatedAt(left)) ||
    timestamp(right.savedAt) - timestamp(left.savedAt),
  );
  return valid[0] ?? null;
}
