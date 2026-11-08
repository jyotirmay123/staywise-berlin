import { requireUser } from "@/app/lib/auth";
import { error, json, readJson } from "@/app/lib/http";
import { getDatabase } from "@/app/lib/runtime";

const categories = new Set(["keychains", "rings", "necklaces", "hair-clips", "sets"]);

function productInput(body: Record<string, unknown> | null) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const active = body?.active === false ? 0 : 1;
  if (name.length < 2 || !categories.has(category) || description.length < 3) return null;
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return null;
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return null;
  if (imageUrl && !imageUrl.startsWith("https://") && !imageUrl.startsWith("/api/uploads/")) return null;
  return { name, category, description, price, stock, imageUrl, active };
}

export async function GET(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const { results } = await getDatabase().prepare(
    "SELECT id, name, category, description, price, stock, image_url AS imageUrl, active, created_at AS createdAt FROM products ORDER BY created_at DESC",
  ).all();
  return json({ products: results });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const input = productInput(await readJson(request));
  if (!input) return error("प्रोडक्ट की जानकारी सही भरें।");
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await getDatabase().prepare(
    "INSERT INTO products (id, name, category, description, price, stock, image_url, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, input.name, input.category, input.description, input.price, input.stock, input.imageUrl, input.active, now, now).run();
  return json({ id }, 201);
}

export async function PUT(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const body = await readJson(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const input = productInput(body);
  if (!id || !input) return error("प्रोडक्ट की जानकारी सही भरें।");
  await getDatabase().prepare(
    "UPDATE products SET name = ?, category = ?, description = ?, price = ?, stock = ?, image_url = ?, active = ?, updated_at = ? WHERE id = ?",
  ).bind(input.name, input.category, input.description, input.price, input.stock, input.imageUrl, input.active, Math.floor(Date.now() / 1000), id).run();
  return json({ ok: true });
}

export async function DELETE(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return error("प्रोडक्ट ID जरूरी है।");
  await getDatabase().prepare("UPDATE products SET active = 0, updated_at = ? WHERE id = ?")
    .bind(Math.floor(Date.now() / 1000), id).run();
  return json({ ok: true });
}
