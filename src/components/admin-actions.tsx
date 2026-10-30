"use client";

import { useState } from "react";

export function AdminActions({ paymentId }: { paymentId: string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState<"EMAIL" | "SMS" | "">("");

  async function remind(channel: "EMAIL" | "SMS") {
    setSending(channel);
    setMessage("");
    const response = await fetch("/api/admin/payment-reminders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, channel }) });
    const body = await response.json();
    setMessage(response.ok ? body.message : body.error || "Reminder could not be sent.");
    setSending("");
  }

  return <div><button className="button" onClick={() => remind("EMAIL")} disabled={Boolean(sending)} style={{ fontSize: 12, padding: "7px 10px", marginRight: 6 }}>{sending === "EMAIL" ? "Sending…" : "Email reminder"}</button><button className="button" onClick={() => remind("SMS")} disabled={Boolean(sending)} style={{ fontSize: 12, padding: "7px 10px" }}>{sending === "SMS" ? "Sending…" : "SMS reminder"}</button>{message && <p role="status" style={{ fontSize: 12, margin: "7px 0 0", color: "#5c706c" }}>{message}</p>}</div>;
}

export function AdminSignOut() {
  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }
  return <button className="button" onClick={signOut} style={{ padding: "8px 12px", fontSize: 12 }}>Sign out</button>;
}
