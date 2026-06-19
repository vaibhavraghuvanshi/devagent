import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, password: true } } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (record.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: record.id } });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Update password and delete the token in one transaction
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      db.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Something went wrong.", detail: message }, { status: 503 });
  }
}

/** GET — lightweight token validation so the reset page can pre-check before the user types */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false });

  const record = await db.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true },
  });

  const valid = !!record && record.expiresAt > new Date();
  return NextResponse.json({ valid });
}
