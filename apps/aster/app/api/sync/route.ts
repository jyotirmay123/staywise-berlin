import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portfolioVaults } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 1_000_000;

interface SyncBody {
  vaultId?: unknown;
  vaultKey?: unknown;
  payload?: unknown;
  revision?: unknown;
}

function error(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function isCredential(value: unknown, min: number, max: number): value is string {
  return (
    typeof value === "string" &&
    value.length >= min &&
    value.length <= max &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

async function hashKey(key: string): Promise<string> {
  const bytes = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function validPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const record = payload as Record<string, unknown>;
  return (
    record.version === 1 &&
    Array.isArray(record.investments) &&
    Array.isArray(record.valuations)
  );
}

async function parseBody(request: Request): Promise<SyncBody | null> {
  try {
    return (await request.json()) as SyncBody;
  } catch {
    return null;
  }
}

async function authenticate(vaultId: string, vaultKey: string) {
  const db = getDb();
  const [vault] = await db
    .select()
    .from(portfolioVaults)
    .where(eq(portfolioVaults.id, vaultId))
    .limit(1);

  if (!vault || !constantTimeEqual(vault.accessHash, await hashKey(vaultKey))) {
    return null;
  }
  return vault;
}

export async function GET(request: Request): Promise<Response> {
  const vaultId = request.headers.get("x-vault-id");
  const vaultKey = request.headers.get("x-vault-key");

  if (!isCredential(vaultId, 12, 64) || !isCredential(vaultKey, 24, 128)) {
    return error("Invalid sync credentials.", 400);
  }

  const vault = await authenticate(vaultId, vaultKey);
  if (!vault) {
    return error("Vault not found or sync key is incorrect.", 404);
  }

  return Response.json({
    payload: JSON.parse(vault.payloadJson) as unknown,
    revision: vault.revision,
    updatedAt: vault.updatedAt,
  });
}

export async function POST(request: Request): Promise<Response> {
  const body = await parseBody(request);
  if (
    !body ||
    !isCredential(body.vaultId, 12, 64) ||
    !isCredential(body.vaultKey, 24, 128) ||
    !validPayload(body.payload)
  ) {
    return error("Invalid vault data.", 400);
  }

  const payloadJson = JSON.stringify(body.payload);
  if (new TextEncoder().encode(payloadJson).byteLength > MAX_PAYLOAD_BYTES) {
    return error("Portfolio exceeds 1 MB sync limit.", 413);
  }

  const now = new Date().toISOString();
  try {
    await getDb().insert(portfolioVaults).values({
      id: body.vaultId,
      accessHash: await hashKey(body.vaultKey),
      payloadJson,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return error("Vault already exists. Import it instead.", 409);
  }

  return Response.json({ revision: 1, updatedAt: now }, { status: 201 });
}

export async function PUT(request: Request): Promise<Response> {
  const body = await parseBody(request);
  if (
    !body ||
    !isCredential(body.vaultId, 12, 64) ||
    !isCredential(body.vaultKey, 24, 128) ||
    !Number.isInteger(body.revision) ||
    !validPayload(body.payload)
  ) {
    return error("Invalid sync request.", 400);
  }

  const vault = await authenticate(body.vaultId, body.vaultKey);
  if (!vault) {
    return error("Vault not found or sync key is incorrect.", 404);
  }
  if (vault.revision !== body.revision) {
    return Response.json(
      {
        error: "Cloud version changed. Pull latest data before saving.",
        revision: vault.revision,
      },
      { status: 409 },
    );
  }

  const payloadJson = JSON.stringify(body.payload);
  if (new TextEncoder().encode(payloadJson).byteLength > MAX_PAYLOAD_BYTES) {
    return error("Portfolio exceeds 1 MB sync limit.", 413);
  }

  const revision = vault.revision + 1;
  const updatedAt = new Date().toISOString();
  await getDb()
    .update(portfolioVaults)
    .set({ payloadJson, revision, updatedAt })
    .where(eq(portfolioVaults.id, vault.id));

  return Response.json({ revision, updatedAt });
}
