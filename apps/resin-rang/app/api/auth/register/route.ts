import { createSession, hashPassword } from "@/app/lib/auth";
import { error, json, readJson } from "@/app/lib/http";
import { getDatabase } from "@/app/lib/runtime";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (name.length < 2) return error("नाम कम से कम 2 अक्षर का होना चाहिए।");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("सही ईमेल दर्ज करें।");
  if (password.length < 8) return error("पासवर्ड कम से कम 8 अक्षर का होना चाहिए।");

  const database = getDatabase();
  const existing = await database.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return error("इस ईमेल से अकाउंट पहले से मौजूद है।", 409);
  const id = crypto.randomUUID();
  await database.prepare("INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, name, email, await hashPassword(password), Math.floor(Date.now() / 1000)).run();
  const cookie = await createSession(id, "customer");
  return json({ user: { id, name, email, role: "customer" } }, 201, { "Set-Cookie": cookie });
}
