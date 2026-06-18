import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user, profile] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true },
      }),
      db.userProfile.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      name: user.name ?? "",
      email: user.email ?? "",
      image: user.image ?? null,
      bio: profile?.bio ?? "",
      language: profile?.language ?? "English",
      timezone: profile?.timezone ?? "(GMT+05:30) Asia/Kolkata",
      avatarUrl: profile?.avatarUrl ?? null,
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
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined;
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : undefined;
    const language = typeof body.language === "string" ? body.language : undefined;
    const timezone = typeof body.timezone === "string" ? body.timezone : undefined;

    if (name !== undefined) {
      await db.user.update({ where: { id: session.user.id }, data: { name } });
    }

    await db.userProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, bio, language, timezone },
      update: { bio, language, timezone },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
