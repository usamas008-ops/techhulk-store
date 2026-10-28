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
  items: { title: string; variantTitle?: string | null; price: number; quantity: number; handle?: string | null }[];
  // Where the review links point; they are left out when it is missing.
  siteUrl?: string;
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

// One "review this" link per product, opening its form with the order
// number already filled in (components/ReviewForm.tsx reads ?review=).
function reviewLinks(order: OrderEmail): { title: string; url: string }[] {
  if (!order.orderNumber || !order.siteUrl) return [];
  const seen = new Set<string>();
  return order.items.flatMap((i) => {
    if (!i.handle || seen.has(i.handle)) return [];
    seen.add(i.handle);
    return [{ title: i.title, url: `${order.siteUrl}/products/${encodeURIComponent(i.handle)}?review=${order.orderNumber}#write-review` }];
  });
}

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
    ...(reviewLinks(order).length
      ? ["Once it arrives, tell others how it is:", ...reviewLinks(order).map((l) => `  ${l.title}: ${l.url}`), ""]
      : []),
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
          ${reviewLinks(order).length ? `
          <p style="margin:22px 0 8px;font-size:13px;color:#3d3d3d;">Once your parcel arrives, tell others how it is:</p>
          ${reviewLinks(order).map((l) => `<a href="${esc(l.url)}" style="display:inline-block;margin:0 8px 8px 0;padding:9px 14px;border-radius:8px;border:1.5px solid #111111;color:#111111;font-size:12px;font-weight:bold;text-decoration:none;">Review ${esc(l.title)}</a>`).join("")}` : ""}
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

// Every email goes out the same way; this keeps the SMTP settings and the
// "never throw" rule in one place.
async function send(
  label: string,
  message: { to: string; subject: string; text: string; html: string; replyTo?: string }
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass || !message.to) return;

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
      ...message,
    });
  } catch (err) {
    // Deliberately not rethrown: see the note at the top of this file.
    console.warn(`${label} email failed:`, err);
  }
}

export async function sendOrderConfirmation(order: OrderEmail): Promise<void> {
  await send("order confirmation", { to: order.to, ...renderOrderEmail(order) });
}

// ---------------------------------------------------------------------------
// The shop's own copy of a new order: every detail, so it can be called,
// confirmed and packed straight from the inbox. It goes to ORDER_ALERT_EMAIL,
// or to the SMTP account itself when that is not set. Replying to it reaches
// the shopper whenever they left an email.

export type ShopOrderAlert = {
  orderNumber: number | null;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string;
  subtotal: number;
  delivery: number;
  total: number;
  items: OrderEmail["items"];
  source: string;
  adminUrl: string;
  placedAt: Date;
};

const pkTime = (d: Date) =>
  new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);

// 03001234567 -> 923001234567, the form wa.me wants.
const waNumber = (phone: string) => (phone.startsWith("0") ? `92${phone.slice(1)}` : phone);

function shopAlertSubject(o: ShopOrderAlert): string {
  const who = [o.customerName, o.city].filter(Boolean).join(", ");
  return [`New order${o.orderNumber ? ` #${o.orderNumber}` : ""}`, rs(o.total), who]
    .filter(Boolean)
    .join(" — ");
}

function shopAlertText(o: ShopOrderAlert): string {
  const or = (v: string | null) => v || "not given";
  return [
    `New order${o.orderNumber ? ` #${o.orderNumber}` : ""}`,
    `Placed: ${pkTime(o.placedAt)} (Pakistan time)`,
    "",
    "CUSTOMER",
    `Name:    ${or(o.customerName)}`,
    `Phone:   ${o.phone}`,
    `Email:   ${or(o.email)}`,
    `Address: ${or(o.address)}`,
    `City:    ${or(o.city)}`,
    ...(o.notes ? [`Notes:   ${o.notes}`] : []),
    "",
    "ITEMS",
    ...o.items.map(
      (i) =>
        `- ${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ""} x${i.quantity}` +
        ` — ${rs(i.price * i.quantity)}`
    ),
    "",
    `Subtotal: ${rs(o.subtotal)}`,
    `Delivery: ${o.delivery > 0 ? rs(o.delivery) : "Free"}`,
    `Total:    ${rs(o.total)}  (Cash on Delivery)`,
    "",
    `Came from: ${o.source}`,
    `Open in admin: ${o.adminUrl}`,
  ].join("\n");
}

function shopAlertHtml(o: ShopOrderAlert): string {
  const field = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;width:90px;color:#6b6b6b;font-size:13px;vertical-align:top;">${label}</td>
      <td style="padding:7px 0;color:#111111;font-size:14px;font-weight:600;">${value}</td>
    </tr>`;
  const missing = `<span style="color:#9a9a9a;font-weight:400;">not given</span>`;
  const button = (href: string, text: string, bg: string) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:8px;background:${bg};color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;">${text}</a>`;

  const items = o.items
    .map(
      (i) => `
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #eeeeee;font-size:14px;color:#3d3d3d;">
            ${esc(i.title)}${i.variantTitle ? ` <span style="color:#6b6b6b;">(${esc(i.variantTitle)})</span>` : ""}
          </td>
          <td align="center" style="padding:9px 8px;border-bottom:1px solid #eeeeee;font-size:14px;color:#3d3d3d;white-space:nowrap;">&times;${i.quantity}</td>
          <td align="right" style="padding:9px 0;border-bottom:1px solid #eeeeee;font-size:14px;color:#111111;font-weight:600;white-space:nowrap;">${rs(i.price * i.quantity)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#111111;padding:20px 28px;">
          <span style="color:#c9a25b;font-size:12px;font-weight:bold;letter-spacing:2px;">NEW ORDER</span><br>
          <span style="color:#ffffff;font-size:24px;font-weight:bold;">${o.orderNumber ? `#${o.orderNumber}` : "Order"} &middot; ${rs(o.total)}</span><br>
          <span style="color:#9a9a9a;font-size:12px;">${esc(pkTime(o.placedAt))} &middot; Cash on Delivery</span>
        </td></tr>

        <tr><td style="padding:22px 28px 6px;">
          ${button(`tel:${esc(o.phone)}`, "Call", "#1e51ee")}
          ${button(`https://wa.me/${esc(waNumber(o.phone))}`, "WhatsApp", "#16a34a")}
          ${button(esc(o.adminUrl), "Open in admin", "#111111")}
        </td></tr>

        <tr><td style="padding:10px 28px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#8a8a8a;">CUSTOMER</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${field("Name", o.customerName ? esc(o.customerName) : missing)}
            ${field("Phone", esc(o.phone))}
            ${field("Email", o.email ? `<a href="mailto:${esc(o.email)}" style="color:#1e51ee;">${esc(o.email)}</a>` : missing)}
            ${field("Address", o.address ? esc(o.address) : missing)}
            ${field("City", o.city ? esc(o.city) : missing)}
            ${o.notes ? field("Notes", esc(o.notes)) : ""}
            ${field("Came from", esc(o.source))}
          </table>
        </td></tr>

        <tr><td style="padding:14px 28px 26px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#8a8a8a;">ITEMS</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            <tr><td style="padding:4px 0;color:#6b6b6b;font-size:14px;">Subtotal</td><td align="right" style="padding:4px 0;font-size:14px;color:#111111;">${rs(o.subtotal)}</td></tr>
            <tr><td style="padding:4px 0;color:#6b6b6b;font-size:14px;">Delivery</td><td align="right" style="padding:4px 0;font-size:14px;color:#111111;">${o.delivery > 0 ? rs(o.delivery) : "Free"}</td></tr>
            <tr><td style="padding:6px 0;color:#111111;font-size:16px;font-weight:bold;">Total</td><td align="right" style="padding:6px 0;font-size:16px;font-weight:bold;color:#111111;">${rs(o.total)}</td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** The shop's alert without sending it, for previews and checks. */
export function renderShopOrderAlert(o: ShopOrderAlert) {
  return { subject: shopAlertSubject(o), text: shopAlertText(o), html: shopAlertHtml(o) };
}

export async function sendShopOrderAlert(o: ShopOrderAlert): Promise<void> {
  const to = process.env.ORDER_ALERT_EMAIL || process.env.SMTP_USER || "";
  await send("shop order alert", {
    to,
    // Pressing Reply in the inbox then answers the shopper, not the shop.
    ...(o.email ? { replyTo: o.email } : {}),
    ...renderShopOrderAlert(o),
  });
}
