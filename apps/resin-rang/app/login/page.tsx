import AuthForm from "../auth-form";
import Link from "next/link";

export default function LoginPage() {
  return <main className="auth-shell"><section className="auth-art"><Link className="brand" href="/"><span className="brand-mark">रं</span><span><strong>रेज़िन रंग</strong><small>handmade with love</small></span></Link><div><span>✦</span><h2>आपकी पसंद,<br />आपके अकाउंट में</h2><p>ऑर्डर करें और उसकी स्थिति आसानी से देखें।</p></div></section><section className="auth-card"><Link href="/" className="back-link">← दुकान पर वापस</Link><span className="eyebrow">फिर से स्वागत है</span><h1>लॉग इन</h1><p>अपने ईमेल और पासवर्ड से अकाउंट खोलें।</p><AuthForm mode="login" /><p className="auth-switch">नया अकाउंट चाहिए? <Link href="/register">यहां रजिस्टर करें</Link></p></section></main>;
}
