import { Resend } from "resend";

let resend: Resend | undefined;

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return (resend ??= new Resend(key));
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "SaveMySeat <invites@savemyseat.events>";

/** `"Joseph Ashipa via SaveMySeat" <invites@savemyseat.events>` */
export function fromName(displayName: string) {
  const address = EMAIL_FROM.match(/<([^>]+)>/)?.[1] ?? EMAIL_FROM;
  const clean = displayName.replace(/["<>\r\n]/g, "").trim();
  return clean ? `"${clean} via SaveMySeat" <${address}>` : EMAIL_FROM;
}

export type EmailMessage = { from?: string; to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(message: EmailMessage) {
  const { data, error } = await getResend().emails.send({ from: EMAIL_FROM, ...message });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data!.id;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

// Email-safe palette (mirrors globals.css)
const c = { page: "#f4f3f9", surface: "#ffffff", field: "#f4f3f9", ink: "#1f1d33", muted: "#5e5a73", lilac: "#ece8fb", lilacInk: "#5b49c2" };
const font = "'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Bubble-style email shell. All string arguments are plain text and get escaped,
 * except `bodyHtml`, which callers build from escaped parts.
 */
export function emailLayout({
  preheader,
  eyebrow = "SaveMySeat",
  imageUrl,
  imageAlt = "",
  heading,
  subheading,
  body,
  bodyHtml,
  details,
  cta,
  footnote,
}: {
  preheader?: string;
  eyebrow?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  heading: string;
  subheading?: string | null;
  body?: string;
  bodyHtml?: string;
  details?: { label: string; value: string; href?: string }[];
  cta: { label: string; url: string };
  footnote?: string;
}) {
  const e = escapeHtml;
  const detailRows = (details ?? [])
    .map(
      (d) => `<tr>
        <td style="padding:10px 0;border-top:1px solid #e3e1ee;font-size:14px;color:${c.muted};width:90px;vertical-align:top">${e(d.label)}</td>
        <td style="padding:10px 0;border-top:1px solid #e3e1ee;font-size:16px;color:${c.ink};font-weight:600">${
          d.href ? `<a href="${e(d.href)}" style="color:${c.ink};text-decoration:underline">${e(d.value)}</a>` : e(d.value)
        }</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:${c.page};font-family:${font};color:${c.ink}">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.page};padding:32px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${c.surface};border-radius:28px">
    ${imageUrl ? `<tr><td style="padding:8px 8px 0"><img src="${e(imageUrl)}" alt="${e(imageAlt)}" width="504" style="display:block;width:100%;height:auto;border-radius:22px;border:0"></td></tr>` : ""}
    <tr><td style="padding:32px 28px 36px">
      <div style="display:inline-block;background:${c.lilac};border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;color:${c.lilacInk}">${e(eyebrow)}</div>
      <h1 style="margin:20px 0 6px;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.02em">${e(heading)}</h1>
      ${subheading ? `<p style="margin:0 0 4px;font-size:16px;color:${c.muted}">${e(subheading)}</p>` : ""}
      ${body || bodyHtml ? `<p style="margin:16px 0 0;font-size:17px;line-height:1.6;color:${c.muted}">${bodyHtml ?? e(body!)}</p>` : ""}
      ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${detailRows}</table>` : ""}
      <a href="${e(cta.url)}" style="display:block;margin-top:28px;text-align:center;background:${c.ink};color:#ffffff;text-decoration:none;font-size:17px;font-weight:600;padding:16px 24px;border-radius:999px">${e(cta.label)}</a>
      ${footnote ? `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${c.muted}">${e(footnote)}</p>` : ""}
    </td></tr>
  </table>
  <p style="margin:20px 0 0;font-size:12px;color:${c.muted}">Sent with SaveMySeat</p>
</td></tr></table>
</body></html>`;
}
