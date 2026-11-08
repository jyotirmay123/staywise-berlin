"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = { id: string; name: string; category: string; description: string; price: number; stock: number; imageUrl: string; active: number | boolean };
type OrderItem = { productName: string; quantity: number; price: number };
type Order = { id: string; customerName: string; phone: string; address: string; paymentMethod: string; status: string; total: number; createdAt: number; items: OrderItem[] };
const categoryLabels: Record<string, string> = { keychains: "कीचेन्स", rings: "रिंग्स", necklaces: "नेकलेसेस", "hair-clips": "हेयर क्लिप्स", sets: "नेकलेस + इयररिंग सेट्स" };
const statuses = ["नया", "तैयार हो रहा है", "भेज दिया", "पूरा", "रद्द"];
const money = new Intl.NumberFormat("hi-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminPanel() {
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me").then((response) => response.json()) as { user?: { role?: string } };
    if (me.user?.role !== "admin") { window.location.assign("/login?next=/admin"); return; }
    const [productData, orderData] = await Promise.all([
      fetch("/api/admin/products").then((response) => response.json() as Promise<{ products?: Product[] }>),
      fetch("/api/admin/orders").then((response) => response.json() as Promise<{ orders?: Order[] }>),
    ]);
    setProducts(productData.products ?? []); setOrders(orderData.orders ?? []);
  }
  useEffect(() => {
    void fetch("/api/auth/me").then((response) => response.json() as Promise<{ user?: { role?: string } }>).then(async (me) => {
      if (me.user?.role !== "admin") { window.location.assign("/login?next=/admin"); return; }
      const [productData, orderData] = await Promise.all([
        fetch("/api/admin/products").then((response) => response.json() as Promise<{ products?: Product[] }>),
        fetch("/api/admin/orders").then((response) => response.json() as Promise<{ orders?: Order[] }>),
      ]);
      setProducts(productData.products ?? []); setOrders(orderData.orders ?? []);
    });
  }, []);
  const filtered = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const lowStock = products.filter((product) => product.active && product.stock <= 3).length;
  const revenue = orders.filter((order) => order.status !== "रद्द").reduce((sum, order) => sum + order.total, 0);

  async function changeStatus(id: string, status: string) {
    await fetch("/api/admin/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }

  async function archive(id: string) {
    if (!window.confirm("यह प्रोडक्ट दुकान से हट जाएगा। जारी रखें?")) return;
    await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link className="brand" href="/"><span className="brand-mark">रं</span><span><strong>रेज़िन रंग</strong><small>स्टोर एडमिन</small></span></Link><nav><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><span>◇</span> प्रोडक्ट्स</button><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><span>▤</span> ऑर्डर्स <b>{orders.filter((order) => order.status === "नया").length}</b></button></nav><div><Link href="/">दुकान देखें →</Link></div></aside>
    <section className="admin-main"><header><div><span className="eyebrow">स्टोर मैनेजमेंट</span><h1>{tab === "products" ? "प्रोडक्ट्स" : "ऑर्डर्स"}</h1></div><div className="admin-avatar">A</div></header>
      <div className="stats"><article><span>कुल प्रोडक्ट्स</span><strong>{products.filter((product) => product.active).length}</strong><small>लाइव कलेक्शन</small></article><article><span>कम स्टॉक</span><strong>{lowStock}</strong><small>3 या उससे कम</small></article><article><span>कुल ऑर्डर्स</span><strong>{orders.length}</strong><small>{orders.filter((order) => order.status === "नया").length} नए</small></article><article><span>ऑर्डर वैल्यू</span><strong>{money.format(revenue)}</strong><small>रद्द ऑर्डर छोड़कर</small></article></div>
      {tab === "products" ? <section className="admin-section"><div className="admin-toolbar"><div><h2>इन्वेंटरी</h2><p>प्राइस, स्टॉक और फोटो संभालें</p></div><div><input placeholder="प्रोडक्ट खोजें…" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="primary-button" onClick={() => setEditing("new")}>+ नया प्रोडक्ट</button></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>प्रोडक्ट</th><th>कैटेगरी</th><th>प्राइस</th><th>स्टॉक</th><th>स्थिति</th><th /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="table-product"><span style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>✦</span><div><strong>{product.name}</strong><small>{product.description}</small></div></div></td><td>{categoryLabels[product.category]}</td><td>{money.format(product.price)}</td><td><span className={product.stock <= 3 ? "low-stock" : ""}>{product.stock}</span></td><td><span className={`status-dot ${product.active ? "live" : "off"}`}>{product.active ? "लाइव" : "छिपा"}</span></td><td><button className="row-action" onClick={() => setEditing(product)}>एडिट</button><button className="row-action danger" onClick={() => archive(product.id)}>हटाएं</button></td></tr>)}</tbody></table></div></section> : <section className="admin-section"><div className="admin-toolbar"><div><h2>सभी ऑर्डर्स</h2><p>ग्राहक, पेमेंट और डिलीवरी स्थिति</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ऑर्डर</th><th>ग्राहक</th><th>आइटम</th><th>कुल</th><th>पेमेंट</th><th>स्थिति</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{new Date(order.createdAt * 1000).toLocaleDateString("hi-IN")}</small></td><td><strong>{order.customerName}</strong><small>{order.phone}<br />{order.address}</small></td><td>{order.items.map((item) => <small key={item.productName}>{item.productName} × {item.quantity}<br /></small>)}</td><td><strong>{money.format(order.total)}</strong></td><td>{order.paymentMethod === "upi" ? "UPI" : "COD"}</td><td><select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div></section>}
    </section>
    {editing && <ProductModal product={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}
  </main>;
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [error, setError] = useState(""); const [uploading, setUploading] = useState(false); const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  async function upload(file: File) { setUploading(true); const form = new FormData(); form.set("image", file); const response = await fetch("/api/admin/uploads", { method: "POST", body: form }); const data = await response.json() as { error?: string; url?: string }; setUploading(false); if (!response.ok) setError(data.error ?? "फोटो अपलोड नहीं हुई।"); else if (data.url) setImageUrl(data.url); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const values = new FormData(event.currentTarget); const payload = { id: product?.id, name: values.get("name"), category: values.get("category"), description: values.get("description"), price: Number(values.get("price")), stock: Number(values.get("stock")), imageUrl, active: values.get("active") === "on" }; const response = await fetch("/api/admin/products", { method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json() as { error?: string }; if (!response.ok) { setError(data.error ?? "प्रोडक्ट सेव नहीं हुआ।"); return; } await onSaved(); }
  return <div className="overlay"><div className="product-modal"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">{product ? "प्रोडक्ट एडिट करें" : "नया कलेक्शन आइटम"}</span><h2>{product ? product.name : "नया प्रोडक्ट"}</h2><form className="product-form" onSubmit={submit}><label>नाम<input name="name" defaultValue={product?.name} required /></label><label>कैटेगरी<select name="category" defaultValue={product?.category ?? "keychains"}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>विवरण<textarea name="description" defaultValue={product?.description} rows={3} required /></label><div className="form-row"><label>प्राइस (₹)<input name="price" type="number" min="0" step="1" defaultValue={product?.price ?? 299} required /></label><label>स्टॉक<input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 1} required /></label></div><label>प्रोडक्ट फोटो<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} /><small>{uploading ? "फोटो अपलोड हो रही है…" : imageUrl ? "फोटो तैयार है" : "5MB तक JPG, PNG, WebP या AVIF"}</small></label><label className="check-label"><input name="active" type="checkbox" defaultChecked={product ? Boolean(product.active) : true} /> दुकान में दिखाएं</label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={uploading}>{product ? "बदलाव सेव करें" : "प्रोडक्ट जोड़ें"}</button></form></div></div>;
}
