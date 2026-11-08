import AuthForm from "../auth-form";
import Link from "next/link";

export default function RegisterPage() {
  return <main className="auth-shell"><section className="auth-art"><Link className="brand" href="/"><span className="brand-mark">रं</span><span><strong>रेज़िन रंग</strong><small>handmade with love</small></span></Link><div><span>✦</span><h2>रंगों की दुनिया<br />में स्वागत है</h2><p>अपना अकाउंट बनाएं और पसंदीदा पीस घर मंगाएं।</p></div></section><section className="auth-card"><Link href="/" className="back-link">← दुकान पर वापस</Link><span className="eyebrow">नया ग्राहक</span><h1>अकाउंट बनाएं</h1><p>रजिस्ट्रेशन में बस एक मिनट लगेगा।</p><AuthForm mode="register" /><p className="auth-switch">पहले से अकाउंट है? <Link href="/login">लॉग इन करें</Link></p></section></main>;
}
