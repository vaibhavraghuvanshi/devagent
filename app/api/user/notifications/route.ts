import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrismaDelegate } from "@/lib/prisma-model-guard";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const userNotifications = getPrismaDelegate(
      (db as unknown as { userNotifications?: typeof db.userNotifications }).userNotifications,
      "userNotifications"
    );
    const notifications = await userNotifications.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      emailNotifications: notifications.emailNotifications,
      pushNotifications: notifications.pushNotifications,
      productUpdates: notifications.productUpdates,
      securityAlerts: notifications.securityAlerts,
      weeklySummary: notifications.weeklySummary,
      quietHoursStart: notifications.quietHoursStart,
      quietHoursEnd: notifications.quietHoursEnd,
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
    const userNotifications = getPrismaDelegate(
      (db as unknown as { userNotifications?: typeof db.userNotifications }).userNotifications,
      "userNotifications"
    );
    const data: Record<string, unknown> = {};

    if (typeof body.emailNotifications === "boolean") data.emailNotifications = body.emailNotifications;
    if (typeof body.pushNotifications === "boolean") data.pushNotifications = body.pushNotifications;
    if (typeof body.productUpdates === "boolean") data.productUpdates = body.productUpdates;
    if (typeof body.securityAlerts === "boolean") data.securityAlerts = body.securityAlerts;
    if (typeof body.weeklySummary === "boolean") data.weeklySummary = body.weeklySummary;

    if (typeof body.quietHoursStart === "string") {
      const quietHoursStart = body.quietHoursStart.trim();
      if (!isValidTime(quietHoursStart)) {
        return NextResponse.json({ error: "quietHoursStart must be HH:MM" }, { status: 400 });
      }
      data.quietHoursStart = quietHoursStart;
    }

    if (typeof body.quietHoursEnd === "string") {
      const quietHoursEnd = body.quietHoursEnd.trim();
      if (!isValidTime(quietHoursEnd)) {
        return NextResponse.json({ error: "quietHoursEnd must be HH:MM" }, { status: 400 });
      }
      data.quietHoursEnd = quietHoursEnd;
    }

    await userNotifications.upsert({
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
