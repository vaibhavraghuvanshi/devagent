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
  const userId = session.user.id; // capture before async callbacks lose narrowing

  try {
    const body = await req.json();

    // Email update — atomic: conflict-check + update in one transaction
    // prevents a race condition where two requests could both pass the check
    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      try {
        await db.$transaction(async (tx) => {
          const existing = await tx.user.findUnique({ where: { email } });
          if (existing && existing.id !== userId) {
            throw Object.assign(new Error("Email already in use"), { code: "EMAIL_IN_USE" });
          }
          await tx.user.update({ where: { id: userId }, data: { email } });
        });
      } catch (e) {
        if ((e as { code?: string }).code === "EMAIL_IN_USE") {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
        throw e;
      }
    }

    // Password change
    if (body.currentPassword && body.newPassword) {
      const user = await db.user.findUnique({ where: { id: userId } });
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
      await db.user.update({ where: { id: userId }, data: { password: hashed } });
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
  const userId = session.user.id;

  try {
    await db.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
