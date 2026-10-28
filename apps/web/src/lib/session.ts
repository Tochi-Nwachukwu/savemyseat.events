import { headers } from "next/headers";
import { prisma } from "@savemyseat/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "admin";
}

/** For /admin: signed-in admins only; everyone else gets a 404. */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!(await isAdmin(user.id))) notFound();
  return user;
}

/** For signed-in pages: returns the user or redirects to /login. */
export async function requireUser(next?: string) {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return session.user;
}
