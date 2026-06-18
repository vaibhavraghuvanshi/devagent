import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        mode: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      sessions: rows.map((r) => ({
        id: r.id,
        title: r.title,
        mode: r.mode === "agent" ? "agent" : "chat",
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Database error", detail: message },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "New chat";
    const mode = body.mode === "agent" ? "agent" : "chat";

    const row = await db.chatSession.create({
      data: {
        userId: session.user.id,
        title,
        mode,
      },
      select: { id: true, title: true, mode: true, createdAt: true },
    });

    return NextResponse.json({
      session: {
        id: row.id,
        title: row.title,
        mode: row.mode === "agent" ? "agent" : "chat",
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Database error", detail: message },
      { status: 503 }
    );
  }
}
