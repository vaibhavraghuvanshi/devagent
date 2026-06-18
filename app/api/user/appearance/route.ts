import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Theme } from "@prisma/client";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appearance = await db.userAppearance.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ theme: appearance.theme.toLowerCase() });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const themeMap: Record<string, Theme> = { system: "SYSTEM", dark: "DARK", light: "LIGHT" };
    const theme = themeMap[body.theme as string];

    if (!theme) {
      return NextResponse.json({ error: "Invalid theme value" }, { status: 400 });
    }

    await db.userAppearance.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, theme },
      update: { theme },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: message }, { status: 503 });
  }
}
