import { type InviteStatus, prisma } from "@savemyseat/db";
import { getResend } from "@/lib/email";

// Progress only moves forward (a late "delivered" never overwrites "opened").
const PROGRESS: InviteStatus[] = ["NOT_SENT", "SENT", "DELIVERED", "OPENED"];

const STATUS_FOR_EVENT: Record<string, InviteStatus | undefined> = {
  "email.delivered": "DELIVERED",
  "email.opened": "OPENED",
  "email.clicked": "OPENED",
  "email.bounced": "BOUNCED",
  "email.failed": "FAILED",
  "email.suppressed": "FAILED",
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });

  const payload = await req.text();
  let event;
  try {
    event = getResend().webhooks.verify({
      payload,
      webhookSecret: secret,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const status = STATUS_FOR_EVENT[event.type];
  const emailId = "data" in event && event.data && "email_id" in event.data ? event.data.email_id : undefined;
  if (!status || !emailId) return Response.json({ ignored: event.type });

  const progressIndex = PROGRESS.indexOf(status);
  const { count } = await prisma.guest.updateMany({
    where: {
      lastEmailId: emailId,
      // Forward-only for progress; failures always win.
      ...(progressIndex >= 0 ? { inviteStatus: { in: PROGRESS.slice(0, progressIndex) } } : {}),
    },
    data: { inviteStatus: status },
  });
  return Response.json({ updated: count });
}
