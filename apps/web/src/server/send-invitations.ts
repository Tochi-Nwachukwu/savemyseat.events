import "server-only";
import { type Event, type Guest, prisma, type User } from "@savemyseat/db";
import { EMAIL_FROM, getResend } from "@/lib/email";
import { invitationEmail } from "@/lib/invitation-emails";

const BATCH_SIZE = 100; // Resend batch limit

/** Sends invites or reminders in batches and records the Resend email ids. */
export async function sendInvitations(event: Event, host: Pick<User, "name" | "email">, guests: Guest[], kind: "invite" | "reminder") {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < guests.length; i += BATCH_SIZE) {
    const chunk = guests.slice(i, i + BATCH_SIZE);
    const { data, error } = await getResend().batch.send(
      chunk.map((g) => {
        const email = invitationEmail(event, g, host, kind);
        return { ...email, from: email.from ?? EMAIL_FROM };
      }),
    );
    if (error || !data) {
      console.error("Resend batch failed", error);
      failed += chunk.length;
      await prisma.guest.updateMany({
        where: { id: { in: chunk.map((g) => g.id) }, inviteStatus: "NOT_SENT" },
        data: { inviteStatus: "FAILED" },
      });
      continue;
    }

    const now = new Date();
    await prisma.$transaction(
      chunk.map((g, idx) =>
        prisma.guest.update({
          where: { id: g.id },
          data:
            kind === "invite"
              ? { inviteStatus: "SENT", sentAt: now, lastEmailId: data.data[idx]?.id ?? null }
              : { remindedAt: now, lastEmailId: data.data[idx]?.id ?? g.lastEmailId },
        }),
      ),
    );
    sent += chunk.length;
  }
  return { sent, failed };
}
