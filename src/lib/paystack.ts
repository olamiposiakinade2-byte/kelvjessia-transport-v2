import { createHmac, timingSafeEqual } from "crypto";
const baseUrl = "https://api.paystack.co";
function secret() { const key = process.env.PAYSTACK_SECRET_KEY; if (!key?.startsWith("sk_")) throw new Error("Paystack test key is not configured."); return key; }
export async function initializePaystack(email: string, amountKobo: number, reference: string, callbackUrl: string) {
  const response = await fetch(`${baseUrl}/transaction/initialize`, { method: "POST", headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: amountKobo, currency: "NGN", reference, callback_url: callbackUrl }) });
  if (!response.ok) throw new Error("Paystack could not initialize this payment."); return response.json() as Promise<{ data: { authorization_url: string } }>;
}
export async function verifyPaystack(reference: string) { const response = await fetch(`${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret()}` }, cache: "no-store" }); if (!response.ok) throw new Error("Paystack verification failed."); return response.json() as Promise<{ data: { id: number; status: string; amount: number; currency: string; reference: string } }>; }
export function validWebhook(rawBody: string, signature: string | null) { if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false; const digest = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex"); return digest.length === signature.length && timingSafeEqual(Buffer.from(digest), Buffer.from(signature)); }
