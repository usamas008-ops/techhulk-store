// Shared by the storefront section and the admin page, so it must not import
// anything server-only.

export type Testimonial = {
  id: string;
  name: string;
  city: string | null;
  body: string;
  rating: number | null;
  product_id: string | null;
  photo_url: string | null;
  source: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

// Where a testimonial came from. Shown on the card as "via WhatsApp", so a
// shopper can tell it is a real message and not copy the shop wrote.
export const TESTIMONIAL_SOURCES: Record<string, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google review",
  call: "Phone call",
  other: "Other",
};

export const TESTIMONIAL_LIMITS = { name: 60, city: 60, body: 600 } as const;
