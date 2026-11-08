import { requireUser } from "@/app/lib/auth";
import { error, json } from "@/app/lib/http";
import { getEnv } from "@/app/lib/runtime";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const bucket = getEnv().MEDIA;
  if (!bucket) return error("इमेज स्टोरेज उपलब्ध नहीं है।", 503);
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || !allowedTypes.has(file.type)) return error("JPG, PNG, WebP या AVIF इमेज चुनें।");
  if (file.size > 5 * 1024 * 1024) return error("इमेज 5MB से छोटी रखें।");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const key = `products/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return json({ url: `/api/uploads/${key}` }, 201);
}
