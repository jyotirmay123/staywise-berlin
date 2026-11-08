"use client";

import { useEffect, useState } from "react";

type Product = { id: string; name: string; category: string; description: string; price: number; stock: number; imageUrl: string };
type CartItem = Product & { quantity: number };
type User = { id: string; name: string; email: string; role: "customer" | "admin" };

const categories = [
  { id: "all", label: "सभी" },
  { id: "keychains", label: "कीचेन्स" },
  { id: "rings", label: "रिंग्स" },
  { id: "necklaces", label: "नेकलेसेस" },
  { id: "hair-clips", label: "हेयर क्लिप्स" },
  { id: "sets", label: "नेकलेस + इयररिंग सेट्स" },
];

const money = new Intl.NumberFormat("hi-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetch("/api/products").then((response) => response.json() as Promise<{ products?: Product[] }>).then((data) => setProducts(data.products ?? []));
    void fetch("/api/auth/me").then((response) => response.json() as Promise<{ user?: User | null }>).then((data) => setUser(data.user ?? null));
  }, []);

  const visible = category === "all" ? products : products.filter((product) => product.category === category);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} कार्ट में जुड़ गया`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((current) => current.flatMap((item) => item.id === id ? (quantity > 0 ? [{ ...item, quantity: Math.min(quantity, item.stock) }] : []) : [item]));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="रेज़िन रंग होम">
          <span className="brand-mark">रं</span>
          <span><strong>रेज़िन रंग</strong><small>handmade with love</small></span>
        </a>
        <nav aria-label="मुख्य नेविगेशन">
          <a href="#collection">कलेक्शन</a>
          <a href="#story">हमारी कहानी</a>
          {user ? <a href={user.role === "admin" ? "/admin" : "/account"}>नमस्ते, {user.name.split(" ")[0]}</a> : <a href="/login">लॉग इन</a>}
          {user && <button className="text-button" onClick={logout}>लॉग आउट</button>}
        </nav>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`कार्ट में ${count} आइटम`}>
          कार्ट <span>{count}</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">हर पीस, सिर्फ आपके लिए</span>
          <h1>हर रंग में<br /><em>आपकी कहानी</em></h1>
          <p>फूलों, चमक और प्यार से बनी खूबसूरत रेज़िन ज्वेलरी — रोज़ के लिए भी, खास पलों के लिए भी।</p>
          <a className="primary-button" href="#collection">कलेक्शन देखें <span>→</span></a>
          <div className="hero-proof"><span>100% हैंडमेड</span><span>सुरक्षित पैकिंग</span><span>पूरे भारत में डिलीवरी</span></div>
        </div>
        <div className="hero-art" aria-label="रंगीन रेज़िन ज्वेलरी का सजावटी दृश्य">
          <div className="resin-disc disc-one"><i>र</i></div>
          <div className="resin-disc disc-two"><i>♥</i></div>
          <div className="resin-ring ring-one" />
          <div className="resin-ring ring-two" />
          <div className="petal petal-one" /><div className="petal petal-two" /><div className="spark spark-one">✦</div><div className="spark spark-two">✦</div>
        </div>
      </section>

      <section className="trust-strip"><span>छोटे बैच में तैयार</span><span className="dot">◆</span><span>हर पीस अनोखा</span><span className="dot">◆</span><span>प्यार से पैक किया</span></section>

      <section className="collection" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">अपना पसंदीदा चुनें</span><h2>हमारा कलेक्शन</h2></div>
          <p>हर चीज़ हाथ से बनाई गई है, इसलिए रंग और फूलों में हल्का फर्क उसकी खूबसूरती है।</p>
        </div>
        <div className="category-tabs" role="tablist" aria-label="प्रोडक्ट श्रेणियां">
          {categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        {visible.length ? (
          <div className="product-grid">
            {visible.map((product, index) => <ProductCard key={product.id} product={product} index={index} onAdd={addToCart} />)}
          </div>
        ) : <div className="empty-state"><div>✦</div><h3>इस कलेक्शन में नए डिज़ाइन जल्द आएंगे</h3><p>दूसरी कैटेगरी देखें या बाद में फिर आइए।</p></div>}
      </section>

      <section className="story" id="story">
        <div className="story-art"><div className="large-orb">हाथों<br />का हुनर</div><span>✦</span></div>
        <div className="story-copy"><span className="eyebrow">दिल से बनाया</span><h2>छोटी-सी कला,<br />बड़ी-सी खुशी</h2><p>हर रेज़िन पीस को रंग, सूखे फूल और बारीक चमक से धीरे-धीरे बनाया जाता है। हमारा मकसद है — आपके रोज़मर्रा में थोड़ा रंग और हर गिफ्ट में यादगार एहसास जोड़ना।</p><a href="#collection">अपना पीस चुनें →</a></div>
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark">रं</span><span><strong>रेज़िन रंग</strong><small>handmade with love</small></span></div><p>हाथों से बना। दिल से चुना।</p><div><a href="#collection">कलेक्शन</a><a href="/login">अकाउंट</a><a href="/admin">एडमिन</a></div></footer>

      {notice && <div className="toast" role="status">✓ {notice}</div>}
      {cartOpen && <CartDrawer cart={cart} total={total} user={user} onClose={() => setCartOpen(false)} onUpdate={updateQuantity} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
      {checkoutOpen && <Checkout cart={cart} total={total} user={user} onClose={() => setCheckoutOpen(false)} onComplete={(message) => { setCart([]); setCheckoutOpen(false); setNotice(message); }} />}
    </main>
  );
}

function ProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: (product: Product) => void }) {
  const categoryLabel = categories.find((item) => item.id === product.category)?.label ?? product.category;
  return <article className="product-card">
    <div className={`product-image fallback-${index % 4}`} style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>
      {!product.imageUrl && <div className="mini-resin"><span>✦</span></div>}
      {product.stock <= 3 && product.stock > 0 && <span className="stock-badge">बस {product.stock} बाकी</span>}
    </div>
    <div className="product-info"><span>{categoryLabel}</span><h3>{product.name}</h3><p>{product.description}</p><div><strong>{money.format(product.price)}</strong><button disabled={product.stock < 1} onClick={() => onAdd(product)}>{product.stock > 0 ? "कार्ट में डालें" : "स्टॉक खत्म"}</button></div></div>
  </article>;
}

function CartDrawer({ cart, total, user, onClose, onUpdate, onCheckout }: { cart: CartItem[]; total: number; user: User | null; onClose: () => void; onUpdate: (id: string, quantity: number) => void; onCheckout: () => void }) {
  return <div className="overlay" onMouseDown={onClose}><aside className="drawer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label="शॉपिंग कार्ट">
    <div className="drawer-head"><div><span className="eyebrow">आपकी पसंद</span><h2>शॉपिंग कार्ट</h2></div><button onClick={onClose} aria-label="कार्ट बंद करें">×</button></div>
    <div className="cart-items">{cart.length ? cart.map((item) => <div className="cart-item" key={item.id}><div className="cart-thumb" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>✦</div><div><h3>{item.name}</h3><span>{money.format(item.price)}</span><div className="quantity"><button onClick={() => onUpdate(item.id, item.quantity - 1)}>−</button><b>{item.quantity}</b><button onClick={() => onUpdate(item.id, item.quantity + 1)}>+</button></div></div><button className="remove" onClick={() => onUpdate(item.id, 0)}>हटाएं</button></div>) : <div className="empty-cart"><span>◇</span><h3>कार्ट अभी खाली है</h3><button onClick={onClose}>कलेक्शन देखें</button></div>}</div>
    {!!cart.length && <div className="cart-total"><div><span>कुल</span><strong>{money.format(total)}</strong></div><small>डिलीवरी शुल्क पते के अनुसार तय होगा</small>{user ? <button className="primary-button" onClick={onCheckout}>चेकआउट करें →</button> : <a className="primary-button" href="/login?next=/">लॉग इन करके ऑर्डर करें →</a>}</div>}
  </aside></div>;
}

function Checkout({ cart, total, user, onClose, onComplete }: { cart: CartItem[]; total: number; user: User | null; onClose: () => void; onComplete: (message: string) => void }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: values.get("name"), phone: values.get("phone"), address: values.get("address"), paymentMethod: values.get("payment"), items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })) }) });
    const data = await response.json() as { error?: string; order?: { id: string } }; setLoading(false);
    if (!response.ok) { setError(data.error ?? "ऑर्डर नहीं हो पाया।"); return; }
    onComplete(`ऑर्डर ${data.order?.id ?? ""} सफलतापूर्वक मिल गया`);
  }
  return <div className="overlay"><div className="checkout-card" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">आखिरी कदम</span><h2>डिलीवरी की जानकारी</h2><p>कुल: <strong>{money.format(total)}</strong></p><form onSubmit={submit}><label>पूरा नाम<input name="name" defaultValue={user?.name ?? ""} required minLength={2} /></label><label>फोन नंबर<input name="phone" inputMode="tel" required minLength={8} /></label><label>पूरा पता<textarea name="address" required minLength={10} rows={3} /></label><fieldset><legend>पेमेंट</legend><label><input type="radio" name="payment" value="cod" defaultChecked /> कैश ऑन डिलीवरी</label><label><input type="radio" name="payment" value="upi" /> UPI (ऑर्डर के बाद संपर्क)</label></fieldset>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? "ऑर्डर भेज रहे हैं…" : "ऑर्डर पक्का करें →"}</button></form></div></div>;
}
