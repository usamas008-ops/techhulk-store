import nodemailer from "nodemailer";

// Sends the shopper their order confirmation over SMTP.
//
// Like lib/notify.ts, this is a courtesy and never a condition: the order is
// already saved by the time anything here runs, and every failure is
// swallowed. With no SMTP_HOST / SMTP_USER / SMTP_PASSWORD set, nothing is
// sent at all — that is simply the feature being switched off, not an error.
//
// Gmail wants an App Password here, never the account password:
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_USER=you@gmail.com

export type OrderEmail = {
  to: string;
  orderNumber: number | null;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  delivery: number;
  total: number;
  items: { title: string; variantTitle?: string | null; price: number; quantity: number }[];
};

// A shopper must never sit at a spinner because a mail server is slow, and
// on Vercel the whole checkout request is killed at maxDuration. This leaves
// room for the database work that has to finish first.
const TIMEOUT_MS = 6000;

const rs = (n: number) => `Rs.${Number(n).toLocaleString("en-PK")}`;

// Everything here ends up inside HTML, and a name or a product title can
// legitimately contain & or <, so it is escaped rather than trusted.
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

function subjectFor(order: OrderEmail): string {
  return order.orderNumber
    ? `Order #${order.orderNumber} received — TechHulk`
    : "Order received — TechHulk";
}

function textBody(order: OrderEmail): string {
  const lines = [
    `Thank you${order.customerName ? `, ${order.customerName}` : ""}!`,
    "",
    order.orderNumber ? `Your order number is #${order.orderNumber}.` : "We have your order.",
    "",
    "What you ordered:",
    ...order.items.map(
      (i) =>
        `  ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ""} x${i.quantity}` +
        ` — ${rs(i.price * i.quantity)}`
    ),
    "",
    `Subtotal: ${rs(order.subtotal)}`,
    `Delivery: ${order.delivery > 0 ? rs(order.delivery) : "Free"}`,
    `Total: ${rs(order.total)}`,
    "",
    "Payment: Cash on Delivery. Pay the courier when your parcel arrives.",
    `We will call you on ${order.phone} to confirm this order before we send it.`,
    "",
    "TechHulk — techhulk.store",
  ];
  return lines.join("\n");
}

function htmlBody(order: OrderEmail): string {
  const rows = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eeeeee;color:#3d3d3d;font-size:14px;">
            ${esc(i.title)}${i.variantTitle ? ` <span style="color:#6b6b6b;">(${esc(i.variantTitle)})</span>` : ""}
            <span style="color:#6b6b6b;">&times;${i.quantity}</span>
          </td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #eeeeee;color:#111111;font-size:14px;font-weight:600;white-space:nowrap;">
            ${rs(i.price * i.quantity)}
          </td>
        </tr>`
    )
    .join("");

  const line = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:5px 0;color:${strong ? "#111111" : "#6b6b6b"};font-size:${strong ? "16px" : "14px"};font-weight:${strong ? "700" : "400"};">${label}</td>
      <td align="right" style="padding:5px 0;color:#111111;font-size:${strong ? "16px" : "14px"};font-weight:${strong ? "700" : "600"};white-space:nowrap;">${value}</td>
    </tr>`;

  const where = [order.address, order.city].filter(Boolean).map(esc).join(", ");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#111111;padding:22px 28px;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;">Tech<span style="color:#c9a25b;">Hulk</span></span>
        </td></tr>

        <tr><td style="padding:28px;">
          <p style="margin:0 0 6px;font-size:19px;font-weight:bold;color:#111111;">
            Thank you${order.customerName ? `, ${esc(order.customerName)}` : ""}!
          </p>
          <p style="margin:0 0 22px;font-size:14px;color:#6b6b6b;line-height:1.6;">
            ${order.orderNumber ? `Your order number is <strong style="color:#111111;">#${order.orderNumber}</strong>. ` : ""}We have received it and will call you shortly to confirm.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
            ${line("Subtotal", rs(order.subtotal))}
            ${line("Delivery", order.delivery > 0 ? rs(order.delivery) : "Free")}
            ${line("Total", rs(order.total), true)}
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#f7f7f7;border-radius:12px;">
            <tr><td style="padding:16px 18px;font-size:13px;color:#3d3d3d;line-height:1.7;">
              <strong style="color:#111111;">Cash on Delivery</strong><br>
              Pay the courier in cash when your parcel arrives. No advance payment.<br>
              We will call you on <strong style="color:#111111;">${esc(order.phone)}</strong> to confirm before dispatch.
              ${where ? `<br>Delivering to: ${where}` : ""}
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#fafafa;padding:18px 28px;border-top:1px solid #eeeeee;font-size:12px;color:#8a8a8a;line-height:1.7;">
          Questions? Just reply to this email.<br>
          TechHulk &middot; <a href="https://techhulk.store" style="color:#8a8a8a;">techhulk.store</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * The finished message, without sending it. Exported so the email can be
 * looked at and checked without a mail server and without posting anything
 * to a real person.
 */
export function renderOrderEmail(order: OrderEmail) {
  return { subject: subjectFor(order), text: textBody(order), html: htmlBody(order) };
}

export async function sendOrderConfirmation(order: OrderEmail): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass || !order.to) return;

  const port = Number(process.env.SMTP_PORT) || 587;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      // 465 is the implicit-TLS port; 587 starts plain and upgrades.
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `TechHulk <${user}>`,
      to: order.to,
      subject: subjectFor(order),
      text: textBody(order),
      html: htmlBody(order),
    });
  } catch (err) {
    // Deliberately not rethrown: see the note at the top of this file.
    console.warn("order confirmation email failed:", err);
  }
}
