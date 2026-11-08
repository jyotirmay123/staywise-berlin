import type { PortfolioData, VaultCredentials } from "./domain";

const DB_NAME = "aster-portfolio";
const STORE_NAME = "state";
const DATA_KEY = "portfolio";
const CREDENTIALS_KEY = "vault";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function read<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function write<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export const localStore = {
  loadPortfolio: (): Promise<PortfolioData | null> =>
    read<PortfolioData>(DATA_KEY),
  savePortfolio: (data: PortfolioData): Promise<void> => write(DATA_KEY, data),
  loadCredentials: (): Promise<VaultCredentials | null> =>
    read<VaultCredentials>(CREDENTIALS_KEY),
  saveCredentials: (credentials: VaultCredentials): Promise<void> =>
    write(CREDENTIALS_KEY, credentials),
};
