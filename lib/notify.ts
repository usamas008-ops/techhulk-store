// Tells the shop about a new order on WhatsApp, through CallMeBot.
//
// A notification is a convenience, never a condition. Every failure here is
// swallowed: an order that is already saved in the database must not be
// reported to the shopper as failed just because a message did not go out.
// With no CALLMEBOT_API_KEY set, nothing is sent and nothing is logged as
// wrong — that is simply the feature being switched off.

export type OrderSummary = {
  orderNumber: number | null;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  items: { title: string; quantity: number }[];
};

// CallMeBot can be slow or down. Waiting longer than this would make every
// shopper wait at checkout for a message that is not theirs.
const TIMEOUT_MS = 3000;

export function orderMessage(order: OrderSummary): string {
  const lines = [
    `*New order${order.orderNumber ? ` #${order.orderNumber}` : ""}*`,
    "",
    `Name: ${order.customerName || "not given"}`,
    `Phone: ${order.phone}`,
    `City: ${order.city || "not given"}`,
    `Total: Rs.${order.total.toLocaleString("en-PK")}`,
    "",
    ...order.items.map((item) => `- ${item.title} x${item.quantity}`),
  ];
  return lines.join("\n");
}

export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  // The number to tell is the shop's own WhatsApp line unless a separate one
  // is set, so turning this on usually means adding the key and nothing else.
  const to = (
    process.env.NOTIFY_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    ""
  ).replace(/\D/g, "");

  if (!apiKey || !to) return;

  const url =
    "https://api.callmebot.com/whatsapp.php" +
    `?phone=${encodeURIComponent(to)}` +
    `&text=${encodeURIComponent(orderMessage(order))}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  try {
    await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    // Deliberately not rethrown: see the note at the top of this file.
    console.warn("order WhatsApp notification failed:", err);
  }
}
