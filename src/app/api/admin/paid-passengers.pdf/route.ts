import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-request";

export async function GET(request: NextRequest) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", payment: { is: { status: "SUCCESSFUL" } } },
    include: { customer: true, trip: { include: { route: true } }, seats: { include: { seat: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  });
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([842, 595]);
  let y = 550;
  const drawHeader = () => {
    page.drawText("KelvJessia Transport — Paid Passengers", { x: 40, y, size: 18, font: bold, color: rgb(0.04, 0.29, 0.28) });
    y -= 26;
    page.drawText(`Generated ${new Date().toLocaleString("en-NG")}`, { x: 40, y, size: 9, font: regular });
    y -= 24;
    page.drawText("Reference", { x: 40, y, size: 9, font: bold });
    page.drawText("Passenger", { x: 155, y, size: 9, font: bold });
    page.drawText("Contact", { x: 305, y, size: 9, font: bold });
    page.drawText("Journey / Seat", { x: 445, y, size: 9, font: bold });
    y -= 14;
  };
  drawHeader();
  for (const booking of bookings) {
    if (y < 55) { page = pdf.addPage([842, 595]); y = 550; drawHeader(); }
    const journey = `${booking.trip.route.origin} - ${booking.trip.route.destination} / ${booking.seats.map(({ seat }) => seat.number).join(", ")}`;
    page.drawText(booking.reference, { x: 40, y, size: 8, font: regular });
    page.drawText(booking.customer.fullName.slice(0, 26), { x: 155, y, size: 8, font: regular });
    page.drawText(`${booking.customer.email.slice(0, 22)} ${booking.customer.phone}`, { x: 305, y, size: 7, font: regular });
    page.drawText(journey.slice(0, 44), { x: 445, y, size: 8, font: regular });
    y -= 15;
  }
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="kelvjessia-paid-passengers.pdf"', "Cache-Control": "no-store" } });
}
