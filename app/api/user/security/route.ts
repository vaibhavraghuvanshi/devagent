import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrismaDelegate } from "@/lib/prisma-model-guard";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const userSecurity = getPrismaDelegate(
      (db as unknown as { userSecurity?: typeof db.userSecurity }).userSecurity,
      "userSecurity"
    );
    const security = await userSecurity.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      twoFactorEnabled: security.twoFactorEnabled,
      loginAlerts: security.loginAlerts,
      suspiciousSignInDetection: security.suspiciousSignInDetection,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const userSecurity = getPrismaDelegate(
      (db as unknown as { userSecurity?: typeof db.userSecurity }).userSecurity,
      "userSecurity"
    );

    const data: Record<string, unknown> = {};
    if (typeof body.twoFactorEnabled === "boolean") data.twoFactorEnabled = body.twoFactorEnabled;
    if (typeof body.loginAlerts === "boolean") data.loginAlerts = body.loginAlerts;
    if (typeof body.suspiciousSignInDetection === "boolean") data.suspiciousSignInDetection = body.suspiciousSignInDetection;

    await userSecurity.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
