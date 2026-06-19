/**
 * Dev seed — run once with:  npx prisma db seed
 *
 * Upserts a default dev user so login always works after a database
 * reset or `prisma db push`. Safe to re-run at any time.
 *
 * Dev credentials:
 *   Email   : dev@devagent.local
 *   Password: DevAgent@123
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  const DEV_EMAIL    = "dev@devagent.local";
  const DEV_PASSWORD = "DevAgent@123";
  const DEV_NAME     = "Dev User";

  const hashed = await bcrypt.hash(DEV_PASSWORD, 12);

  const user = await db.user.upsert({
    where:  { email: DEV_EMAIL },
    // Re-hashes the password every run — safe & ensures a clean state
    update: { password: hashed, name: DEV_NAME },
    create: { email: DEV_EMAIL, name: DEV_NAME, password: hashed },
  });

  console.log("\n✅  Dev user ready");
  console.log("   Email   :", user.email);
  console.log("   Password:", DEV_PASSWORD);
  console.log("   User ID :", user.id, "\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
