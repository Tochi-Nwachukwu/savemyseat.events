/**
 * Makes an account an admin and gives it a fresh random password.
 *   pnpm admin:create you@example.com
 * Works for existing (magic-link) accounts too. Run again to reset the password.
 * Uses DATABASE_URL from the repo-root .env, so it acts on whichever branch that points at.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

const { prisma } = await import("@savemyseat/db");
const { hashPassword } = await import("better-auth/crypto");

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: pnpm admin:create you@example.com");
  process.exit(1);
}

const password = randomBytes(18).toString("base64url"); // 24 characters

const user = await prisma.user.upsert({
  where: { email },
  update: { role: "admin", emailVerified: true },
  create: { id: randomUUID(), email, name: "", emailVerified: true, role: "admin" },
});

// better-auth stores email/password logins as a "credential" account.
const hash = await hashPassword(password);
const credential = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
if (credential) {
  await prisma.account.update({ where: { id: credential.id }, data: { password: hash } });
} else {
  await prisma.account.create({
    data: { id: randomUUID(), accountId: user.id, providerId: "credential", userId: user.id, password: hash },
  });
}

console.log(`\n  Admin ready: ${email}`);
console.log(`  Password:    ${password}`);
console.log(`\n  Save it in your password manager now; it isn't stored anywhere in plain text.`);
console.log(`  Sign in at /login → "Use a password instead", then open /admin.\n`);
await prisma.$disconnect();
