import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

const currency = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

export default async function Admin() {
  const [totalBookings, pendingPayments, revenue, newEnquiries, recentBookings] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESSFUL" }, _sum: { amountKobo: true } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true, trip: { include: { route: true } }, payment: true, seats: { include: { seat: true } } },
    }),
  ]);
  const stats = [
    ["Total bookings", String(totalBookings)],
    ["Pending payments", String(pendingPayments)],
    ["Verified revenue", currency.format((revenue._sum.amountKobo ?? 0) / 100)],
    ["New enquiries", String(newEnquiries)],
  ];

  return <><SiteHeader /><main className="shell" style={{ padding: "48px 0" }}>
    <p className="eyebrow">Operations portal</p>
    <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "8px 0 28px" }}>Operations overview</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>{stats.map(([name, value]) => <div className="card" key={name} style={{ padding: 18 }}><p style={{ margin: 0, color: "#667874", fontSize: 13 }}>{name}</p><b style={{ fontSize: 30 }}>{value}</b></div>)}</div>
    <section className="card" style={{ padding: 26, marginTop: 24, overflowX: "auto" }}>
      <h2 style={{ marginTop: 0 }}>Recent bookings</h2>
      {recentBookings.length === 0 ? <p style={{ color: "#5c706c" }}>No bookings yet.</p> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}><thead><tr style={{ textAlign: "left", color: "#5c706c", fontSize: 13 }}><th style={{ padding: "10px 0" }}>Reference</th><th>Customer</th><th>Journey</th><th>Seats</th><th>Payment</th><th>Booking</th></tr></thead><tbody>{recentBookings.map((booking) => <tr key={booking.id} style={{ borderTop: "1px solid #e0e8e2" }}><td style={{ padding: "14px 0", fontWeight: 700 }}>{booking.reference}</td><td>{booking.customer.fullName}<br /><span style={{ color: "#667874", fontSize: 12 }}>{booking.customer.email}</span></td><td>{booking.trip.route.origin} → {booking.trip.route.destination}</td><td>{booking.seats.map(({ seat }) => seat.number).join(", ") || "—"}</td><td><b>{booking.payment?.status.replaceAll("_", " ") ?? "—"}</b></td><td>{booking.status.replaceAll("_", " ")}</td></tr>)}</tbody></table>}
    </section>
  </main></>;
}
