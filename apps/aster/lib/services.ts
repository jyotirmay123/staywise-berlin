import type { PortfolioData, VaultCredentials } from "./domain";

interface FxResponse {
  date: string;
  rate: number;
}

interface SyncResponse {
  payload?: PortfolioData;
  revision: number;
  updatedAt: string;
  error?: string;
}

export interface AccountSyncState {
  revision: number;
  updatedAt: string;
}

export async function fetchEurInrRate(): Promise<FxResponse> {
  const response = await fetch("https://api.frankfurter.dev/v2/rate/EUR/INR");
  if (!response.ok) throw new Error("Live FX rate unavailable.");
  const data = (await response.json()) as FxResponse;
  if (!Number.isFinite(data.rate) || data.rate <= 0) {
    throw new Error("FX provider returned invalid rate.");
  }
  return data;
}

function randomToken(bytes: number): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...values))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function syncRequest(
  method: "POST" | "PUT",
  data: PortfolioData,
  credentials: VaultCredentials,
): Promise<VaultCredentials> {
  const response = await fetch("/api/sync", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vaultId: credentials.vaultId,
      vaultKey: credentials.vaultKey,
      revision: credentials.revision,
      payload: data,
    }),
  });
  const result = (await response.json()) as SyncResponse;
  if (!response.ok) throw new Error(result.error ?? "Cloud sync failed.");
  return {
    ...credentials,
    revision: result.revision,
    updatedAt: result.updatedAt,
  };
}

export async function createVault(
  data: PortfolioData,
): Promise<VaultCredentials> {
  const credentials: VaultCredentials = {
    vaultId: randomToken(12),
    vaultKey: randomToken(32),
    revision: 0,
    updatedAt: "",
  };
  return syncRequest("POST", data, credentials);
}

export async function pushVault(
  data: PortfolioData,
  credentials: VaultCredentials,
): Promise<VaultCredentials> {
  return syncRequest("PUT", data, credentials);
}

export async function pullVault(
  vaultId: string,
  vaultKey: string,
): Promise<{ data: PortfolioData; credentials: VaultCredentials }> {
  const response = await fetch("/api/sync", {
    headers: { "x-vault-id": vaultId, "x-vault-key": vaultKey },
  });
  const result = (await response.json()) as SyncResponse;
  if (!response.ok || !result.payload) {
    throw new Error(result.error ?? "Cloud vault unavailable.");
  }
  return {
    data: result.payload,
    credentials: {
      vaultId,
      vaultKey,
      revision: result.revision,
      updatedAt: result.updatedAt,
    },
  };
}

export async function pullAccountPortfolio(): Promise<{
  data: PortfolioData;
  state: AccountSyncState;
} | null> {
  const response = await fetch("/api/account-sync", { cache: "no-store" });
  const result = (await response.json()) as SyncResponse;
  if (response.status === 404) return null;
  if (!response.ok || !result.payload) {
    throw new Error(result.error ?? "Account cloud unavailable.");
  }
  return {
    data: result.payload,
    state: { revision: result.revision, updatedAt: result.updatedAt },
  };
}

export async function createAccountPortfolio(
  data: PortfolioData,
): Promise<AccountSyncState> {
  const response = await fetch("/api/account-sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: data }),
  });
  const result = (await response.json()) as SyncResponse;
  if (!response.ok) throw new Error(result.error ?? "Account cloud setup failed.");
  return { revision: result.revision, updatedAt: result.updatedAt };
}

export async function pushAccountPortfolio(
  data: PortfolioData,
  state: AccountSyncState,
): Promise<AccountSyncState> {
  const response = await fetch("/api/account-sync", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: data, revision: state.revision }),
  });
  const result = (await response.json()) as SyncResponse;
  if (!response.ok) throw new Error(result.error ?? "Account cloud sync failed.");
  return { revision: result.revision, updatedAt: result.updatedAt };
}

export function exportPortfolio(data: PortfolioData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `aster-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
