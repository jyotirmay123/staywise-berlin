import { env } from "cloudflare:workers";

type D1Result = { success: boolean; meta?: { changes?: number }; results?: unknown[] };
type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<D1Result>;
};
export type D1Database = {
  prepare: (query: string) => D1Statement;
  batch: (statements: D1Statement[]) => Promise<D1Result[]>;
};
type R2ObjectBody = { body: ReadableStream; httpMetadata?: { contentType?: string } };
export type R2Bucket = {
  put: (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectBody | null>;
};

export type AppEnv = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
};

export function getEnv(): AppEnv {
  return env as unknown as AppEnv;
}

export function getDatabase(): D1Database {
  const database = getEnv().DB;
  if (!database) throw new Error("Database binding unavailable");
  return database;
}
