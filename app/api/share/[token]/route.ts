import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/share/[token] — public, no auth required */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  const { token } = await params;

  try {
    const shared = await db.sharedChat.findUnique({
      where: { shareToken: token },
      include: {
        chatSession: {
          select: {
            title: true,
            mode: true,
            createdAt: true,
            messages: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                role: true,
                content: true,
                modelId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!shared) {
      return NextResponse.json({ error: "Share link not found or has been revoked." }, { status: 404 });
    }

    const { chatSession } = shared;

    return NextResponse.json({
      title: chatSession.title,
      mode: chatSession.mode,
      createdAt: chatSession.createdAt.toISOString(),
      sharedAt: shared.createdAt.toISOString(),
      messages: chatSession.messages.map((m) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
        modelId: m.modelId ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
