import { getEnv } from "@/app/lib/runtime";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }): Promise<Response> {
  const bucket = getEnv().MEDIA;
  if (!bucket) return new Response("Not found", { status: 404 });
  const { key } = await context.params;
  const object = await bucket.get(key.join("/"));
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
