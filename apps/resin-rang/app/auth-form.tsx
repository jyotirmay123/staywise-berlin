"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const values = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name"), email: values.get("email"), password: values.get("password") }) });
    const data = await response.json() as { error?: string; user?: { role?: string } }; setLoading(false);
    if (!response.ok) { setError(data.error ?? "कुछ गलत हुआ।"); return; }
    if (data.user?.role === "admin") router.push("/admin");
    else router.push(params.get("next") || "/account");
    router.refresh();
  }
  return <form className="auth-form" onSubmit={submit}>
    {mode === "register" && <label>आपका नाम<input name="name" autoComplete="name" required minLength={2} /></label>}
    <label>ईमेल<input name="email" type="email" autoComplete="email" required /></label>
    <label>पासवर्ड<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-button" disabled={loading}>{loading ? "कृपया रुकें…" : mode === "login" ? "लॉग इन करें →" : "अकाउंट बनाएं →"}</button>
  </form>;
}
