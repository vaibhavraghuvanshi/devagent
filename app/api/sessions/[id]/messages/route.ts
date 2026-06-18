import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prismaMessageToClient } from "@/lib/chat-serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const chatSession = await db.chatSession.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!chatSession) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await db.chatMessage.findMany({
      where: { chatSessionId: id },
      orderBy: { createdAt: "asc" },
      include: { toolCalls: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({
      messages: rows.map(prismaMessageToClient),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Database error", detail: message },
      { status: 503 }
    );
  }
}
