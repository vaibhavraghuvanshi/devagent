import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrismaDelegate } from "@/lib/prisma-model-guard";

const ALLOWED_SYNC_INTERVALS = [5, 15, 30, 60];

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const userIntegrations = getPrismaDelegate(
      (db as unknown as { userIntegrations?: typeof db.userIntegrations }).userIntegrations,
      "userIntegrations"
    );
    const integrations = await userIntegrations.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      githubConnected: integrations.githubConnected,
      slackConnected: integrations.slackConnected,
      jiraConnected: integrations.jiraConnected,
      linearConnected: integrations.linearConnected,
      webhookUrl: integrations.webhookUrl,
      syncIntervalMinutes: integrations.syncIntervalMinutes,
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
    const userIntegrations = getPrismaDelegate(
      (db as unknown as { userIntegrations?: typeof db.userIntegrations }).userIntegrations,
      "userIntegrations"
    );
    const data: Record<string, unknown> = {};

    if (typeof body.githubConnected === "boolean") data.githubConnected = body.githubConnected;
    if (typeof body.slackConnected === "boolean") data.slackConnected = body.slackConnected;
    if (typeof body.jiraConnected === "boolean") data.jiraConnected = body.jiraConnected;
    if (typeof body.linearConnected === "boolean") data.linearConnected = body.linearConnected;

    if (typeof body.webhookUrl === "string") {
      const webhookUrl = body.webhookUrl.trim();
      if (webhookUrl.length > 0 && !isValidHttpUrl(webhookUrl)) {
        return NextResponse.json({ error: "Webhook URL must be a valid http(s) URL" }, { status: 400 });
      }
      data.webhookUrl = webhookUrl.length > 0 ? webhookUrl.slice(0, 500) : null;
    }

    if (typeof body.syncIntervalMinutes === "number") {
      if (!ALLOWED_SYNC_INTERVALS.includes(body.syncIntervalMinutes)) {
        return NextResponse.json({ error: "Invalid sync interval" }, { status: 400 });
      }
      data.syncIntervalMinutes = body.syncIntervalMinutes;
    }

    await userIntegrations.upsert({
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
