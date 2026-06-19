import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

const EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return the same 200 response — never reveal whether an account exists.
    const genericOk = NextResponse.json({ success: true });

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, password: true },
    });

    // No account or OAuth-only account (no password) → silently do nothing
    if (!user || !user.password) return genericOk;

    // Delete any existing token for this user (one active link at a time)
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token     = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl   = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_SERVER_HOST,
      port:   Number(process.env.EMAIL_SERVER_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    await transporter.sendMail({
      from:    `"Dev Agent" <${process.env.EMAIL_SERVER_USER}>`,
      to:      user.email!,
      subject: "Reset your Dev Agent password",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:16px;padding:40px;border:1px solid #E5E7EB;">
                <tr><td align="center" style="padding-bottom:24px;">
                  <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#6D5DF6,#8B7EFF);display:inline-flex;align-items:center;justify-content:center;">
                    <span style="font-size:28px;">🔑</span>
                  </div>
                </td></tr>
                <tr><td style="font-size:22px;font-weight:700;color:#111827;text-align:center;padding-bottom:8px;">
                  Reset your password
                </td></tr>
                <tr><td style="font-size:14px;color:#6B7280;text-align:center;padding-bottom:28px;line-height:1.6;">
                  Hi ${user.name ?? "there"}, we received a request to reset the password for your Dev Agent account.
                  This link expires in <strong>${EXPIRY_HOURS} hour</strong>.
                </td></tr>
                <tr><td align="center" style="padding-bottom:28px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#15b728,#22d63b);color:#fff;font-size:15px;font-weight:600;text-decoration:none;">
                    Reset Password
                  </a>
                </td></tr>
                <tr><td style="font-size:12px;color:#9CA3AF;text-align:center;padding-bottom:16px;">
                  If you didn&apos;t request this, you can safely ignore this email — your password won&apos;t change.
                </td></tr>
                <tr><td style="font-size:11px;color:#D1D5DB;text-align:center;word-break:break-all;">
                  ${resetUrl}
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    return genericOk;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[forgot-password]", message);
    // Still return 200 to the client — don't leak server errors
    return NextResponse.json({ success: true });
  }
}
