import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPrismaDelegate } from "@/lib/prisma-model-guard";

const ALLOWED_PLANS = ["free", "pro", "team"] as const;
const ALLOWED_BILLING_CYCLES = ["monthly", "yearly"] as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const userBilling = getPrismaDelegate(
      (db as unknown as { userBilling?: typeof db.userBilling }).userBilling,
      "userBilling"
    );
    const billing = await userBilling.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });

    return NextResponse.json({
      plan: billing.plan,
      billingCycle: billing.billingCycle,
      autoRenew: billing.autoRenew,
      usageAlerts: billing.usageAlerts,
      spendLimitUsd: billing.spendLimitUsd,
      invoiceEmail: billing.invoiceEmail,
      taxId: billing.taxId,
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
    const userBilling = getPrismaDelegate(
      (db as unknown as { userBilling?: typeof db.userBilling }).userBilling,
      "userBilling"
    );
    const data: Record<string, unknown> = {};

    if (typeof body.plan === "string") {
      if (!ALLOWED_PLANS.includes(body.plan as (typeof ALLOWED_PLANS)[number])) {
        return NextResponse.json({ error: "Invalid plan value" }, { status: 400 });
      }
      data.plan = body.plan;
    }

    if (typeof body.billingCycle === "string") {
      if (!ALLOWED_BILLING_CYCLES.includes(body.billingCycle as (typeof ALLOWED_BILLING_CYCLES)[number])) {
        return NextResponse.json({ error: "Invalid billing cycle value" }, { status: 400 });
      }
      data.billingCycle = body.billingCycle;
    }

    if (typeof body.autoRenew === "boolean") data.autoRenew = body.autoRenew;
    if (typeof body.usageAlerts === "boolean") data.usageAlerts = body.usageAlerts;

    if (typeof body.spendLimitUsd === "number") {
      const spendLimit = Math.floor(body.spendLimitUsd);
      if (spendLimit < 0 || spendLimit > 100000) {
        return NextResponse.json({ error: "Spend limit must be between 0 and 100000" }, { status: 400 });
      }
      data.spendLimitUsd = spendLimit;
    }

    if (typeof body.invoiceEmail === "string") {
      const invoiceEmail = body.invoiceEmail.trim().toLowerCase();
      if (invoiceEmail.length > 0 && !isValidEmail(invoiceEmail)) {
        return NextResponse.json({ error: "Invoice email is invalid" }, { status: 400 });
      }
      data.invoiceEmail = invoiceEmail.length > 0 ? invoiceEmail.slice(0, 160) : null;
    }

    if (typeof body.taxId === "string") {
      const taxId = body.taxId.trim();
      data.taxId = taxId.length > 0 ? taxId.slice(0, 50) : null;
    }

    await userBilling.upsert({
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
