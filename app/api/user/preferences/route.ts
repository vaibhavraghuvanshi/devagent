import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MODELS } from "@/lib/models";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json({
    defaultModel: prefs.defaultModel,
    defaultMode: prefs.defaultMode,
    sendOnEnter: prefs.sendOnEnter,
    codeHighlighting: prefs.codeHighlighting,
  });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ALLOWED_MODELS = MODELS.map((m) => m.id);

    const data: Record<string, unknown> = {};
    if (typeof body.defaultModel === "string" && ALLOWED_MODELS.includes(body.defaultModel)) {
      data.defaultModel = body.defaultModel;
    }
    if (body.defaultMode === "chat" || body.defaultMode === "agent") {
      data.defaultMode = body.defaultMode;
    }
    if (typeof body.sendOnEnter === "boolean") data.sendOnEnter = body.sendOnEnter;
    if (typeof body.codeHighlighting === "boolean") data.codeHighlighting = body.codeHighlighting;

    await db.userPreferences.upsert({
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
