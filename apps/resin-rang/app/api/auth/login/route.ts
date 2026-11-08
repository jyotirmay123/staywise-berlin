import { createSession, verifyPassword } from "@/app/lib/auth";
import { error, json, readJson } from "@/app/lib/http";
import { getDatabase, getEnv } from "@/app/lib/runtime";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return error("ईमेल और पासवर्ड दर्ज करें।");

  const runtime = getEnv();
  if (runtime.ADMIN_EMAIL?.toLowerCase() === email && runtime.ADMIN_PASSWORD === password) {
    const cookie = await createSession("admin", "admin");
    return json({ user: { id: "admin", name: "स्टोर एडमिन", email, role: "admin" } }, 200, { "Set-Cookie": cookie });
  }

  const user = await getDatabase().prepare("SELECT id, name, email, password_hash AS passwordHash FROM users WHERE email = ?")
    .bind(email).first<{ id: string; name: string; email: string; passwordHash: string }>();
  if (!user || !(await verifyPassword(password, user.passwordHash))) return error("ईमेल या पासवर्ड सही नहीं है।", 401);
  const cookie = await createSession(user.id, "customer");
  return json({ user: { id: user.id, name: user.name, email: user.email, role: "customer" } }, 200, { "Set-Cookie": cookie });
}
