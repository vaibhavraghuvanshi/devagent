import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  try {
    const rows = await db.chatSession.findMany({
      where: {
        userId: session.user.id,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                {
                  messages: {
                    some: { content: { contains: q, mode: "insensitive" } },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        mode: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      sessions: rows.map((r) => ({
        id: r.id,
        title: r.title,
        mode: r.mode === "agent" ? "agent" : "chat",
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        messageCount: r._count.messages,
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
