import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminSession } from "@/lib/admin-auth";

export async function requireAdmin(request: NextRequest) {
  const authorized = await isAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  return authorized ? null : NextResponse.json({ error: "Admin authentication is required." }, { status: 401 });
}
