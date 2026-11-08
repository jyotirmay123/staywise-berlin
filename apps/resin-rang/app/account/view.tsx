"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { productName: string; quantity: number; price: number };
type Order = { id: string; status: string; total: number; createdAt: number; items: Item[] };
const money = new Intl.NumberFormat("hi-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AccountView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { void fetch("/api/orders").then(async (response) => { if (response.status === 401) { window.location.assign("/login?next=/account"); return; } const data = await response.json() as { orders?: Order[] }; setOrders(data.orders ?? []); }); }, []);
  return <main className="account-shell"><header className="simple-header"><Link className="brand" href="/"><span className="brand-mark">रं</span><span><strong>रेज़िन रंग</strong><small>handmade with love</small></span></Link><Link href="/">दुकान पर वापस →</Link></header><section className="account-content"><span className="eyebrow">मेरा अकाउंट</span><h1>मेरे ऑर्डर्स</h1>{orders === null ? <p>ऑर्डर्स लोड हो रहे हैं…</p> : orders.length === 0 ? <div className="empty-state"><h3>अभी कोई ऑर्डर नहीं</h3><Link href="/">कलेक्शन देखें →</Link></div> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div><div><small>ऑर्डर</small><strong>{order.id}</strong></div><span className="status-pill">{order.status}</span></div><ul>{order.items.map((item, index) => <li key={`${order.id}-${index}`}><span>{item.productName} × {item.quantity}</span><b>{money.format(item.price * item.quantity)}</b></li>)}</ul><footer><span>{new Date(order.createdAt * 1000).toLocaleDateString("hi-IN")}</span><strong>कुल {money.format(order.total)}</strong></footer></article>)}</div>}</section></main>;
}
