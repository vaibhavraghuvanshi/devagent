import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const privacy = await db.userDataPrivacy.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json({
    saveHistory: privacy.saveHistory,
    analyticsEnabled: privacy.analyticsEnabled,
    dataRetentionDays: privacy.dataRetentionDays,
  });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ALLOWED_RETENTION = [30, 90, 180, 365];

    const data: Record<string, unknown> = {};
    if (typeof body.saveHistory === "boolean") data.saveHistory = body.saveHistory;
    if (typeof body.analyticsEnabled === "boolean") data.analyticsEnabled = body.analyticsEnabled;
    if (typeof body.dataRetentionDays === "number" && ALLOWED_RETENTION.includes(body.dataRetentionDays)) {
      data.dataRetentionDays = body.dataRetentionDays;
    }

    await db.userDataPrivacy.upsert({
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
