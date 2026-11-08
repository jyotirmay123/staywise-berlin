import { getSessionUser } from "@/app/lib/auth";
import { json } from "@/app/lib/http";

export async function GET(request: Request): Promise<Response> {
  return json({ user: await getSessionUser(request) });
}
