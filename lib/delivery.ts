// Delivery charges. Every product can carry its own charge; when it does not,
// the store default from the settings table applies. A charge of 0 means free
// delivery. One parcel goes out per order, so an order pays the highest charge
// among the things in it: a cart of only free products pays nothing.

export type DeliverySettings = { defaultFee: number };

// Used until supabase/add-delivery.sql has been run: no charge anywhere.
export const NO_DELIVERY: DeliverySettings = { defaultFee: 0 };

function clean(value: unknown): number {
  const fee = Number(value);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

export function productDeliveryFee(
  product: { delivery_fee?: number | null },
  settings: DeliverySettings
): number {
  const own = product.delivery_fee;
  return own === null || own === undefined ? clean(settings.defaultFee) : clean(own);
}

export function cartDeliveryFee(items: { deliveryFee?: number | null }[]): number {
  return items.reduce((highest, item) => Math.max(highest, clean(item.deliveryFee)), 0);
}

export function deliveryLabel(fee: number): string {
  return fee > 0 ? `Rs.${fee.toLocaleString()}` : "Free";
}

// What the storefront may promise in general, from the store default. It only
// says "free" when the store charges nothing by default; a product with its
// own charge shows that on its own page.
export function deliveryHeadline(defaultFee: number): { top: string; bottom: string } {
  return defaultFee > 0
    ? { top: `Delivery ${deliveryLabel(defaultFee)}`, bottom: "Nationwide" }
    : { top: "Free Delivery", bottom: "Nationwide" };
}
