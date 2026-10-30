"use client";

import { FormEvent, useState } from "react";

export function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Unable to sign in.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return <main style={{ minHeight: "100vh", background: "#0a4b4a", display: "grid", placeItems: "center", padding: 20 }}><form className="card" onSubmit={submit} style={{ width: "100%", maxWidth: 420, padding: 30 }}><p className="eyebrow">KelvJessia Transport</p><h1 style={{ marginTop: 8 }}>Admin sign in</h1><label className="field">Password<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>{error && <p role="alert" style={{ color: "#a52a2a" }}>{error}</p>}<button className="button dark" disabled={busy} style={{ width: "100%", marginTop: 18 }}>{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
