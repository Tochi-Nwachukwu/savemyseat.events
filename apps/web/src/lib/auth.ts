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

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: vercelOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
