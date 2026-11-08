import { requireUser } from "@/app/lib/auth";
import { error, json, readJson } from "@/app/lib/http";
import { getDatabase } from "@/app/lib/runtime";

type CartItem = { productId: string; quantity: number };

export async function GET(request: Request): Promise<Response> {
  const user = await requireUser(request);
  if (!user) return error("पहले लॉग इन करें।", 401);
  const database = getDatabase();
  const { results: orders } = await database.prepare(
    "SELECT id, customer_name AS customerName, phone, address, payment_method AS paymentMethod, status, total, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC",
  ).bind(user.id).all<Record<string, unknown>>();
  for (const order of orders) {
    const { results } = await database.prepare(
      "SELECT product_name AS productName, quantity, price FROM order_items WHERE order_id = ?",
    ).bind(order.id).all();
    order.items = results;
  }
  return json({ orders });
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireUser(request);
  if (!user || user.role !== "customer") return error("ऑर्डर करने के लिए लॉग इन करें।", 401);
  const body = await readJson(request);
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const paymentMethod = body?.paymentMethod === "upi" ? "upi" : "cod";
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const items: CartItem[] = rawItems.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const quantity = Number(record.quantity);
    return typeof record.productId === "string" && Number.isInteger(quantity) && quantity > 0 && quantity <= 20
      ? [{ productId: record.productId, quantity }] : [];
  });
  if (customerName.length < 2 || phone.length < 8 || address.length < 10) return error("नाम, फोन और पूरा पता सही भरें।");
  if (!items.length || items.length > 50) return error("कार्ट में सही आइटम जोड़ें।");

  const database = getDatabase();
  const productRows = await Promise.all(items.map((item) => database.prepare(
    "SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1",
  ).bind(item.productId).first<{ id: string; name: string; price: number; stock: number }>()));
  let total = 0;
  for (let index = 0; index < items.length; index += 1) {
    const product = productRows[index];
    if (!product || product.stock < items[index].quantity) return error("किसी आइटम का स्टॉक कम है। कार्ट अपडेट करें।", 409);
    total += product.price * items[index].quantity;
  }
  const orderId = `RR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const now = Math.floor(Date.now() / 1000);
  const statements = [database.prepare(
    "INSERT INTO orders (id, user_id, customer_name, phone, address, payment_method, status, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(orderId, user.id, customerName, phone, address, paymentMethod, "नया", total, now)];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const product = productRows[index]!;
    statements.push(database.prepare(
      "INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), orderId, product.id, product.name, item.quantity, product.price));
    statements.push(database.prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?")
      .bind(item.quantity, now, product.id, item.quantity));
  }
  await database.batch(statements);
  return json({ order: { id: orderId, total, status: "नया" } }, 201);
}
