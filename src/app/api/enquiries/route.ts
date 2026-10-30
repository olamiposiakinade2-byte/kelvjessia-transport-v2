import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enquiryReference } from "@/lib/references";
import { allowRequest } from "@/lib/rate-limit";
import { enquirySchema } from "@/lib/validation";
export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  if (!allowRequest(`enquiry:${key}`)) return NextResponse.json({ error: "Too many submissions. Please try again shortly." }, { status: 429 });
  const parsed = enquirySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted information." }, { status: 400 });
  const data = parsed.data;
  const enquiry = await prisma.enquiry.create({ data: { ...data, phone: data.phone || null, reference: enquiryReference() } });
  return NextResponse.json({ reference: enquiry.reference, message: "Your enquiry has been submitted successfully. Our team will respond as soon as possible." }, { status: 201 });
}
