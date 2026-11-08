import { requireUser } from "@/app/lib/auth";
import { error, json, readJson } from "@/app/lib/http";
import { getDatabase } from "@/app/lib/runtime";

const statuses = new Set(["नया", "तैयार हो रहा है", "भेज दिया", "पूरा", "रद्द"]);

export async function GET(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const database = getDatabase();
  const { results: orders } = await database.prepare(
    "SELECT id, customer_name AS customerName, phone, address, payment_method AS paymentMethod, status, total, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 200",
  ).all<Record<string, unknown>>();
  for (const order of orders) {
    const { results } = await database.prepare(
      "SELECT product_name AS productName, quantity, price FROM order_items WHERE order_id = ?",
    ).bind(order.id).all();
    order.items = results;
  }
  return json({ orders });
}

export async function PUT(request: Request): Promise<Response> {
  if (!(await requireUser(request, "admin"))) return error("एडमिन लॉगिन जरूरी है।", 403);
  const body = await readJson(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!id || !statuses.has(status)) return error("सही ऑर्डर और स्टेटस चुनें।");
  await getDatabase().prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
  return json({ ok: true });
}
