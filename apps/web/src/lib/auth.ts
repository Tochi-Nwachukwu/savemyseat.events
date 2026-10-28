import { prisma } from "@savemyseat/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { emailLayout, sendEmail } from "./email";

const LINK_MINUTES = 15;

// Vercel preview/production URLs, in addition to APP_URL.
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

// Accept both example.com and www.example.com, whichever one the domain redirects to.
function wwwTwin(url: string | undefined) {
  if (!url) return [];
  const { protocol, hostname } = new URL(url);
  if (hostname === "localhost" || hostname.endsWith(".vercel.app")) return [];
  return [`${protocol}//${hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`}`];
}

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [...vercelOrigins, ...wwwTwin(process.env.APP_URL)],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Passwords only for accounts created with `pnpm admin:create`; everyone else uses magic links.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [
    magicLink({
      expiresIn: LINK_MINUTES * 60,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        // Local dev convenience: sign in without opening the inbox.
        if (process.env.NODE_ENV === "development") console.info(`[auth] Sign-in link for ${email}: ${url}`);
        await sendEmail({
          to: email,
          subject: "Your SaveMySeat sign-in link",
          html: emailLayout({
            heading: "Sign in to SaveMySeat",
            body: "Tap the button below to sign in. No password needed.",
            cta: { label: "Sign in", url },
            footnote: `This link expires in ${LINK_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
          }),
          text: `Sign in to SaveMySeat: ${url}\n\nThis link expires in ${LINK_MINUTES} minutes.`,
        });
      },
    }),
    nextCookies(), // must stay last
  ],
});
