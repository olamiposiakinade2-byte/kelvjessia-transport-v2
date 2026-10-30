import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validWebhook } from "@/lib/paystack";
export async function POST(request:NextRequest) { const raw=await request.text(); if(!validWebhook(raw,request.headers.get("x-paystack-signature"))) return NextResponse.json({error:"Invalid signature"},{status:401}); const event=JSON.parse(raw); const id=String(event.data?.id ?? event.data?.reference); try { await prisma.paymentEvent.create({data:{providerEventId:id,eventType:event.event,payload:event}}); } catch { return NextResponse.json({received:true,duplicate:true}); } return NextResponse.json({received:true}); }
