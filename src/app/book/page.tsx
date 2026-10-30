"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Trip = { id: string; route: string; priceKobo: number; pickup: { id: string; name: string; pickupAt: string; estimatedDropoffAt: string }; seats: { id: string; number: string }[] };

export default function Book() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/trips").then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error); setTrip(body); }).catch((e) => setError(e.message)); }, []);
  const toggle = (id: string) => setChosen((current) => current.includes(id) ? current.filter((seat) => seat !== id) : [...current, id]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const reserve = async () => {
    if (!trip || !chosen.length || !form.fullName || !form.email || !form.phone) { setError("Select at least one seat and complete your contact details."); return; }
    setBusy(true); setError("");
    const response = await fetch("/api/reservations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tripId: trip.id, pickupLocationId: trip.pickup.id, seatIds: chosen, ...form, passengerNames: [form.fullName] }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "Your reservation could not be created."); setBusy(false); return; }
    router.push(`/booking/${body.reference}`);
  };
  const total = (trip?.priceKobo ?? 0) * chosen.length;
  return <><SiteHeader /><main className="shell" style={{ padding: "56px 0" }}><p className="eyebrow">Step 1 of 3</p><h1 style={{ fontSize: 42, letterSpacing: "-.06em", margin: "8px 0 26px" }}>Build your journey</h1><div style={{ display: "grid", gridTemplateColumns: "1fr .8fr", gap: 28 }}><section className="card" style={{ padding: 26 }}><h2 style={{ marginTop: 0 }}>Choose your seats</h2><p style={{ color: "#62726f" }}>{trip ? `${trip.route} · ${trip.pickup.name} pickup` : "Loading scheduled trip…"}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "25px 0" }}>{trip?.seats.map((seat) => <button type="button" onClick={() => toggle(seat.id)} key={seat.id} aria-pressed={chosen.includes(seat.id)} style={{ padding: "14px 4px", borderRadius: 11, border: "1px solid #bdd1c5", background: chosen.includes(seat.id) ? "#d6f28c" : "white", fontWeight: 800, cursor: "pointer" }}>{seat.number}</button>)}</div><hr style={{ border: 0, borderTop: "1px solid #e0e8e2" }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}><label className="field">Full name<input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your full name" /></label><label className="field">Email<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" /></label><label className="field">Phone number<input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="0800 000 0000" /></label><label className="field">Pickup point<input readOnly value={trip?.pickup.name ?? "Loading…"} /></label></div></section><aside className="card" style={{ padding: 26, height: "fit-content" }}><p className="eyebrow">Your summary</p><h2>{trip?.route ?? "Your trip"}</h2><p style={{ color: "#617470", lineHeight: 1.7 }}>Scheduled pickup<br /><b style={{ color: "#10292d" }}>{trip ? new Date(trip.pickup.pickupAt).toLocaleString() : "—"}</b><br />Estimated drop-off<br /><b style={{ color: "#10292d" }}>{trip ? new Date(trip.pickup.estimatedDropoffAt).toLocaleString() : "—"}</b></p><div style={{ borderTop: "1px solid #dde5e0", paddingTop: 18 }}><span>{chosen.length} seat(s)</span><b style={{ float: "right" }}>₦{(total / 100).toLocaleString()}</b></div><button onClick={reserve} disabled={busy || !trip || !chosen.length} className="button dark" style={{ width: "100%", marginTop: 20, opacity: busy || !trip || !chosen.length ? .5 : 1 }}>{busy ? "Reserving seats…" : "Continue to payment"}</button>{error && <p role="alert" style={{ background: "#fee7e3", padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.5 }}>{error}</p>}<p style={{ fontSize: 12, color: "#6d7d79", marginTop: 18 }}>Seats are held for 15 minutes while payment is completed.</p></aside></div></main><SiteFooter /></>;
}
