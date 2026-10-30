import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-request";

type Channel = "EMAIL" | "SMS";

async function deliver(channel: Channel, recipient: string, message: string, reference: string) {
  if (channel === "EMAIL") {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { sent: false, message: "Email reminder queued. Add RESEND_API_KEY and EMAIL_FROM to enable delivery." };
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `payment-reminder-${reference}` }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [recipient], subject: "Payment reminder — KelvJessia Transport", text: message }) });
    return response.ok ? { sent: true, message: "Email reminder sent." } : { sent: false, message: "Email provider rejected the reminder." };
  }
  if (!process.env.TERMII_API_KEY || !process.env.TERMII_SENDER_ID || !process.env.TERMII_BASE_URL) return { sent: false, message: "SMS reminder queued. Add TERMII_BASE_URL, TERMII_API_KEY and TERMII_SENDER_ID to enable delivery." };
  const response = await fetch(`${process.env.TERMII_BASE_URL.replace(/\/$/, "")}/api/sms/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: recipient, from: process.env.TERMII_SENDER_ID, sms: message, type: "plain", channel: "generic", api_key: process.env.TERMII_API_KEY }) });
  return response.ok ? { sent: true, message: "SMS reminder sent." } : { sent: false, message: "SMS provider rejected the reminder." };
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const { paymentId, channel } = await request.json().catch(() => ({}));
  if (typeof paymentId !== "string" || (channel !== "EMAIL" && channel !== "SMS")) return NextResponse.json({ error: "A payment and reminder channel are required." }, { status: 400 });
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: { include: { customer: true } } } });
  if (!payment || payment.status === "SUCCESSFUL" || payment.booking.status !== "PENDING_PAYMENT") return NextResponse.json({ error: "This customer does not need a payment reminder." }, { status: 409 });
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/booking/${payment.booking.reference}`;
  const message = `Hello ${payment.booking.customer.fullName}, your KelvJessia Transport booking ${payment.booking.reference} is awaiting payment. Pay securely here: ${paymentUrl}`;
  const recipient = channel === "EMAIL" ? payment.booking.customer.email : payment.booking.customer.phone;
  const reminder = await prisma.paymentReminder.create({ data: { paymentId: payment.id, channel } });
  const result = await deliver(channel, recipient, message, reminder.id);
  await prisma.paymentReminder.update({ where: { id: reminder.id }, data: result.sent ? { status: "SENT", sentAt: new Date(), providerMessage: result.message } : { status: "QUEUED", providerMessage: result.message } });
  return NextResponse.json({ sent: result.sent, message: result.message });
}
