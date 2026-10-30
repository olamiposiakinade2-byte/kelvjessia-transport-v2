"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Payment({ params }: { params: Promise<{ reference: string }> }) {
  const [seconds, setSeconds] = useState(900);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState<"" | "verifying" | "confirmed" | "review">("");
  const [savedForLater, setSavedForLater] = useState(false);
  const searchParams = useSearchParams();
  const paymentReference = searchParams.get("reference");

  useEffect(() => {
    params.then(({ reference: value }) => setReference(value));
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [params]);

  useEffect(() => {
    if (!paymentReference?.startsWith("PAY-")) return;
    let active = true;
    setPaymentState("verifying");
    fetch(`/api/payments/verify/${encodeURIComponent(paymentReference)}`, { method: "POST" })
      .then(async (response) => ({ response, body: await response.json() }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok) {
          setPaymentState("");
          setError(body.error || "We could not verify your payment yet.");
          return;
        }
        setPaymentState(body.status === "confirmed" ? "confirmed" : "review");
      })
      .catch(() => {
        if (active) {
          setPaymentState("");
          setError("We could not verify your payment yet. Please try again shortly.");
        }
      });
    return () => { active = false; };
  }, [paymentReference]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  async function pay() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingReference: reference }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Unable to start payment.");
        return;
      }
      window.location.assign(body.authorizationUrl);
    } catch {
      setError("Unable to contact the payment service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function payLater() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/payments/pay-later", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookingReference: reference }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error || "Unable to save this payment for later."); return; }
      setSavedForLater(true);
    } catch {
      setError("Unable to save this payment for later. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a4b4a", display: "grid", placeItems: "center", padding: 20 }}>
      <section className="card" style={{ padding: 32, maxWidth: 520, width: "100%" }}>
        <p className="eyebrow">Secure your seats</p>
        <h1 style={{ fontSize: 34, letterSpacing: "-.05em", margin: "10px 0" }}>Complete payment</h1>
        <p style={{ color: "#5d706d", lineHeight: 1.6 }}>Your reservation reference is <b>{reference || "…"}</b>.</p>
        <div style={{ background: "#e7f4d4", borderRadius: 14, padding: 18, margin: "22px 0" }}>
          <b style={{ fontSize: 25 }}>{minutes}:{remainingSeconds}</b>
          <p style={{ margin: "5px 0 0", fontSize: 13 }}>Complete your payment within this time to secure your booking.</p>
        </div>
        {paymentState === "confirmed" ? (
          <div style={{ background: "#e7f4d4", borderRadius: 14, padding: 18 }}><b>Payment confirmed</b><p style={{ marginBottom: 0 }}>Your booking is confirmed. KelvJessia Transport will contact you with your trip details.</p></div>
        ) : paymentState === "review" ? (
          <div style={{ background: "#fff2cc", borderRadius: 14, padding: 18 }}><b>Payment received for review</b><p style={{ marginBottom: 0 }}>Our team will confirm this booking shortly.</p></div>
        ) : paymentState === "verifying" ? (
          <p>Verifying your Paystack payment…</p>
        ) : savedForLater ? (
          <div style={{ background: "#fff2cc", borderRadius: 14, padding: 18 }}><b>Saved for later</b><p style={{ marginBottom: 0 }}>Your seats are held for 24 hours. An administrator can send you an email or SMS reminder.</p></div>
        ) : <>
        {error && <p role="alert" style={{ color: "#a52a2a", marginBottom: 14 }}>{error}</p>}
        {seconds > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><button className="button dark" onClick={pay} disabled={!reference || submitting}>{submitting ? "Please wait…" : "Pay now"}</button><button className="button" onClick={payLater} disabled={!reference || submitting}>{submitting ? "Please wait…" : "Pay later"}</button></div>
        ) : (
          <>
            <p>Reservation expired. Please choose a new trip.</p>
            <Link className="button dark" href="/trips">Find a new trip</Link>
          </>
        )}
        </>}
        <p style={{ fontSize: 12, color: "#6d7d79", marginTop: 18 }}>Payments are verified on the server. Card details are never stored by KelvJessia Transport.</p>
      </section>
    </main>
  );
}
