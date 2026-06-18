import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: { select: { provider: true } } },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    email: user.email ?? "",
    name: user.name ?? "",
    hasPassword: !!user.password,
    emailVerified: !!user.emailVerified,
    connectedProviders: user.accounts.map((a) => a.provider),
  });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // Email update
    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      await db.user.update({ where: { id: session.user.id }, data: { email } });
    }

    // Password change
    if (body.currentPassword && body.newPassword) {
      const user = await db.user.findUnique({ where: { id: session.user.id } });
      if (!user?.password) {
        return NextResponse.json({ error: "No password set for this account" }, { status: 400 });
      }
      const valid = await bcrypt.compare(body.currentPassword as string, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if ((body.newPassword as string).length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(body.newPassword as string, 12);
      await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}

export async function DELETE(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
