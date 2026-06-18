import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrismaDelegate } from "@/lib/prisma-model-guard";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const userAdvanced = getPrismaDelegate(
      (db as unknown as { userAdvanced?: typeof db.userAdvanced }).userAdvanced,
      "userAdvanced"
    );
    const advanced = await userAdvanced.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      developerMode: advanced.developerMode,
      betaFeatures: advanced.betaFeatures,
      streamResponses: advanced.streamResponses,
      verboseToolLogs: advanced.verboseToolLogs,
      safeMode: advanced.safeMode,
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
    const userAdvanced = getPrismaDelegate(
      (db as unknown as { userAdvanced?: typeof db.userAdvanced }).userAdvanced,
      "userAdvanced"
    );
    const data: Record<string, unknown> = {};

    if (typeof body.developerMode === "boolean") data.developerMode = body.developerMode;
    if (typeof body.betaFeatures === "boolean") data.betaFeatures = body.betaFeatures;
    if (typeof body.streamResponses === "boolean") data.streamResponses = body.streamResponses;
    if (typeof body.verboseToolLogs === "boolean") data.verboseToolLogs = body.verboseToolLogs;
    if (typeof body.safeMode === "boolean") data.safeMode = body.safeMode;

    await userAdvanced.upsert({
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
