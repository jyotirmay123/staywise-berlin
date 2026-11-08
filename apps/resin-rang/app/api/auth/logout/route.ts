import { clearSession } from "@/app/lib/auth";
import { json } from "@/app/lib/http";

export async function POST(request: Request): Promise<Response> {
  return json({ ok: true }, 200, { "Set-Cookie": await clearSession(request) });
}
