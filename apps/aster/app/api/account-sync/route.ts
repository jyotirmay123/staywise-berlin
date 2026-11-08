import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accountPortfolios } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 1_000_000;
const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";

interface AccountSyncBody {
  payload?: unknown;
  revision?: unknown;
}

function error(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function accountHash(request: Request): Promise<string | null> {
  const userId = request.headers.get(USER_ID_HEADER)?.trim();
  if (userId) return hash(`id:${userId}`);

  const email = request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  return email ? hash(`email:${email}`) : null;
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

async function parseBody(request: Request): Promise<AccountSyncBody | null> {
  try {
    return (await request.json()) as AccountSyncBody;
  } catch {
    return null;
  }
}

function serializePayload(payload: unknown): string | null {
  if (!validPayload(payload)) return null;
  const payloadJson = JSON.stringify(payload);
  return new TextEncoder().encode(payloadJson).byteLength <= MAX_PAYLOAD_BYTES
    ? payloadJson
    : null;
}

export async function GET(request: Request): Promise<Response> {
  const id = await accountHash(request);
  if (!id) return error("Signed-in account required.", 401);

  const [portfolio] = await getDb()
    .select()
    .from(accountPortfolios)
    .where(eq(accountPortfolios.accountHash, id))
    .limit(1);
  if (!portfolio) return error("No account portfolio exists yet.", 404);

  return Response.json({
    payload: JSON.parse(portfolio.payloadJson) as unknown,
    revision: portfolio.revision,
    updatedAt: portfolio.updatedAt,
  });
}

export async function POST(request: Request): Promise<Response> {
  const id = await accountHash(request);
  if (!id) return error("Signed-in account required.", 401);

  const body = await parseBody(request);
  const payloadJson = body ? serializePayload(body.payload) : null;
  if (!payloadJson) return error("Invalid or oversized portfolio data.", 400);

  const now = new Date().toISOString();
  try {
    await getDb().insert(accountPortfolios).values({
      accountHash: id,
      payloadJson,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
  } catch {
    return error("Account portfolio already exists.", 409);
  }

  return Response.json({ revision: 1, updatedAt: now }, { status: 201 });
}

export async function PUT(request: Request): Promise<Response> {
  const id = await accountHash(request);
  if (!id) return error("Signed-in account required.", 401);

  const body = await parseBody(request);
  const payloadJson = body ? serializePayload(body.payload) : null;
  if (!payloadJson || !Number.isInteger(body?.revision)) {
    return error("Invalid or oversized sync request.", 400);
  }

  const [portfolio] = await getDb()
    .select()
    .from(accountPortfolios)
    .where(eq(accountPortfolios.accountHash, id))
    .limit(1);
  if (!portfolio) return error("Account portfolio not found.", 404);
  if (portfolio.revision !== body?.revision) {
    return Response.json(
      { error: "Cloud version changed.", revision: portfolio.revision },
      { status: 409 },
    );
  }

  const revision = portfolio.revision + 1;
  const updatedAt = new Date().toISOString();
  await getDb()
    .update(accountPortfolios)
    .set({ payloadJson, revision, updatedAt })
    .where(eq(accountPortfolios.accountHash, id));

  return Response.json({ revision, updatedAt });
}
