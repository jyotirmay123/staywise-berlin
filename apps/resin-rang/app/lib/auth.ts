import { getDatabase, getEnv } from "./runtime";

const COOKIE_NAME = "resin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

export type SessionUser = { id: string; name: string; email: string; role: "customer" | "admin" };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(length: number): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(length)));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password: string, salt = randomHex(16)): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 210_000 },
    material,
    256,
  );
  return `${salt}.${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split(".");
  if (!salt) return false;
  const candidate = await hashPassword(password, salt);
  if (candidate.length !== stored.length) return false;
  let mismatch = 0;
  for (let index = 0; index < stored.length; index += 1) mismatch |= stored.charCodeAt(index) ^ candidate.charCodeAt(index);
  return mismatch === 0;
}

export async function createSession(userId: string, role: "customer" | "admin"): Promise<string> {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  await getDatabase().prepare("INSERT INTO sessions (token_hash, user_id, role, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, role, expiresAt).run();
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}

export async function clearSession(request: Request): Promise<string> {
  const token = readCookie(request, COOKIE_NAME);
  if (token) await getDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const row = await getDatabase().prepare(
    "SELECT s.user_id AS id, s.role, s.expires_at AS expiresAt, u.name, u.email FROM sessions s LEFT JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
  ).bind(await sha256(token)).first<{ id: string; role: "customer" | "admin"; expiresAt: number; name: string | null; email: string | null }>();
  if (!row || row.expiresAt <= Math.floor(Date.now() / 1000)) return null;
  if (row.role === "admin") {
    return { id: "admin", role: "admin", name: "स्टोर एडमिन", email: getEnv().ADMIN_EMAIL ?? "admin" };
  }
  if (!row.name || !row.email) return null;
  return { id: row.id, role: "customer", name: row.name, email: row.email };
}

export async function requireUser(request: Request, role?: "admin"): Promise<SessionUser | null> {
  const user = await getSessionUser(request);
  if (!user || (role && user.role !== role)) return null;
  return user;
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}
