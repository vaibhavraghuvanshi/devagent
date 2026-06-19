import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prismaMessageToClient } from "@/lib/chat-serialize";

const PAGE_SIZE = 50;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

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
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { toolCalls: { orderBy: { createdAt: "asc" } } },
    });

    const hasMore = rows.length > PAGE_SIZE;
    const messages = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      messages: messages.map(prismaMessageToClient),
      nextCursor,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Database error", detail: message },
      { status: 503 }
    );
  }
}
