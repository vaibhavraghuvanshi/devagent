import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Verify the session belongs to the authenticated user. */
async function ownedSession(id: string, userId: string) {
  return db.chatSession.findFirst({
    where: { id, userId },
    select: { id: true },
  });
}

/** GET /api/sessions/[id]/share — returns current share status */
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
    if (!(await ownedSession(id, session.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const shared = await db.sharedChat.findFirst({
      where: { chatSessionId: id },
      select: { shareToken: true, createdAt: true },
    });

    return NextResponse.json({
      shareToken: shared?.shareToken ?? null,
      createdAt: shared?.createdAt?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}

/** POST /api/sessions/[id]/share — creates (or refreshes) a share link */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    if (!(await ownedSession(id, session.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove any existing share first (refresh semantics)
    await db.sharedChat.deleteMany({ where: { chatSessionId: id } });

    const shareToken = randomBytes(20).toString("hex"); // 40-char hex token
    const shared = await db.sharedChat.create({
      data: { shareToken, chatSessionId: id, userId: session.user.id },
      select: { shareToken: true, createdAt: true },
    });

    return NextResponse.json({
      shareToken: shared.shareToken,
      createdAt: shared.createdAt.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}

/** DELETE /api/sessions/[id]/share — revokes the share link */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.sharedChat.deleteMany({
      where: { chatSessionId: id, userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
