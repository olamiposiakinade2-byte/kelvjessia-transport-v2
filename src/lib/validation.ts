import { z } from "zod";

export const enquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal("")),
  category: z.enum(["GENERAL", "BOOKING_ASSISTANCE", "PAYMENT_ISSUE", "PICKUP_INFORMATION", "DROP_OFF_INFORMATION", "REFUND_REQUEST", "COMPLAINT"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
});

export const reservationSchema = z.object({
  tripId: z.string().cuid(), pickupLocationId: z.string().cuid(),
  seatIds: z.array(z.string().cuid()).min(1).max(8),
  fullName: z.string().trim().min(2).max(120), email: z.string().email(), phone: z.string().min(7).max(30),
  passengerNames: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
});
