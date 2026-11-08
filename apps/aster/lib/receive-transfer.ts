import type { PortfolioData } from './domain';
import { parseTransferMessage, SOURCE_ORIGIN } from './hosted-transfer.ts';

/** A nonce alone is insufficient: the message must come from the exact opened source window. */
export function receivePortfolioTransfer(
  event: { origin: string; source: unknown; data: unknown },
  openedWindow: unknown,
  nonce: string,
): PortfolioData | null {
  if (!openedWindow || event.source !== openedWindow || event.origin !== SOURCE_ORIGIN) return null;
  return parseTransferMessage(event.data, nonce);
}
