import { json } from "@/app/lib/http";
import { getDatabase } from "@/app/lib/runtime";

export async function GET(): Promise<Response> {
  const { results } = await getDatabase().prepare(
    "SELECT id, name, category, description, price, stock, image_url AS imageUrl FROM products WHERE active = 1 ORDER BY created_at DESC",
  ).all();
  return json({ products: results });
}
