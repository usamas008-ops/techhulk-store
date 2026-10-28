// Shared by the product page, the review form, the API route and the admin,
// so nothing here may import server-only code.

export type ProductReview = {
  id: string;
  product_id: string;
  order_id: string | null;
  name: string;
  city: string | null;
  rating: number;
  body: string;
  photo_urls: string[];
  status: "pending" | "approved" | "rejected";
  added_by: "customer" | "admin";
  created_at: string;
};

export const REVIEW_LIMITS = { name: 60, city: 60, body: 1000, minBody: 5, photos: 4 } as const;

// Shown on the card. The database only lets order_id be set for an order
// that really contained the product, so this is a fact, not a claim.
export const isVerifiedBuyer = (r: Pick<ProductReview, "order_id">) => Boolean(r.order_id);

export const reviewDate = (iso: string) =>
  new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(iso));
