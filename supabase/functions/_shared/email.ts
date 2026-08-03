/**
 * The one email this app sends: "here is a 6-digit code".
 *
 * Goes out over Resend's HTTP API rather than SMTP — an SMTP client needs raw
 * TCP, and denomailer crashed the isolate outright (it calls Deno APIs that no
 * longer exist in the runtime's Deno 2.x, from a detached task no try/catch can
 * reach). A plain fetch has none of that surface.
 *
 * Secrets:
 *   RESEND_API_KEY  the re_... key   (falls back to SMTP_PASS, which holds it)
 *   EMAIL_FROM      sender address   (falls back to SMTP_FROM)
 */
import { LOGO_PNG_BASE64 } from "./logo.ts";

// The app's own palette (src/scss/root.scss), so the mail looks like the client
// it came from.
const C = {
  page: "#141516", // --color-dark
  card: "#282829", // --color-base
  panel: "#202021", // --color-section
  line: "#333333", // --color-line-sep
  text: "#cccccc", // --color-text
  bright: "#ffffff", // --color-text-hover
  dim: "#929292", // --color-text-dark
  accent: "#aabedf", // --color-button
};

export interface CodeEmail {
  to: string;
  subject: string;
  /** Heading inside the card. */
  title: string;
  /** Sentence under the code. */
  blurb: string;
  code: string;
}

/**
 * Nested tables with inline styles — the only thing that survives across mail
 * clients. No flex, no grid, no <style> block (Gmail strips it). Outlook
 * ignores border-radius and squares the corners; everything else degrades to a
 * plain dark card.
 */
function codeEmailHtml(title: string, blurb: string, code: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.page};margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:${C.card};border:1px solid ${C.line};border-radius:8px;">
        <tr>
          <td align="center" style="padding:32px 32px 8px 32px;">
            <img src="cid:logo" width="72" height="72" alt="MTG Arena Tool" style="display:block;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 32px 0 32px;font-family:Lato,Helvetica,Arial,sans-serif;font-size:20px;line-height:28px;color:${C.bright};">
            ${title}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 32px 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.panel};border:1px solid ${C.line};border-radius:6px;">
              <tr>
                <td align="center" style="padding:16px 28px;font-family:'Courier New',Courier,monospace;font-size:32px;line-height:36px;letter-spacing:8px;color:${C.accent};font-weight:bold;">
                  ${code}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 32px 0 32px;font-family:Lato,Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:${C.text};">
            ${blurb}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0 32px;">
            <div style="border-top:1px solid ${C.line};font-size:0;line-height:0;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 32px 32px 32px;font-family:Lato,Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:${C.dim};">
            If you didn't ask for this you can ignore this email — nothing has
            been changed on your account.
          </td>
        </tr>
      </table>
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;">
        <tr>
          <td align="center" style="padding:16px 0 0 0;font-family:Lato,Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:${C.dim};">
            MTG Arena Tool
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

export async function sendCodeEmail(mail: CodeEmail): Promise<void> {
  const apiKey =
    Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("SMTP_PASS") ?? "";
  const from =
    Deno.env.get("EMAIL_FROM") ??
    Deno.env.get("SMTP_FROM") ??
    "MTG Arena Tool <no-reply@mtgatool.com>";

  if (!apiKey) throw new Error("No RESEND_API_KEY is configured.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: mail.to,
      subject: mail.subject,
      // Plain-text alternative, for clients that refuse HTML.
      text: [
        `Your confirmation code is ${mail.code}`,
        "",
        mail.blurb,
        "",
        "If you didn't ask for this, you can ignore this email — nothing has been changed on your account.",
      ].join("\n"),
      html: codeEmailHtml(mail.title, mail.blurb, mail.code),
      attachments: [
        {
          filename: "logo.png",
          content: LOGO_PNG_BASE64,
          content_type: "image/png",
          // Referenced as <img src="cid:logo">. Inline rather than hosted: a
          // hosted URL would silently lose the logo if the app deploy moves,
          // and unlike a data: URI this isn't stripped by Gmail.
          content_id: "logo",
        },
      ],
    }),
  });

  if (!res.ok) {
    // Resend's failures are things the operator needs to read verbatim —
    // "domain is not verified", "from address not allowed" — so keep the text.
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}
