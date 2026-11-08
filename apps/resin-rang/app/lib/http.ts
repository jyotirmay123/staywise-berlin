export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
