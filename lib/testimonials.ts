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
  // From supabase/add-testimonial-media.sql; absent before it is run.
  video_url?: string | null;
  audio_url?: string | null;
  order_id?: string | null;
  submitted_by?: "admin" | "customer";
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

// Video and voice testimonials. Kept short on purpose: the files live on the
// Supabase plan's storage and every play counts against its monthly traffic.
export const MEDIA_BUCKET = "testimonial-media";
export const MEDIA_LIMITS = {
  videoSeconds: 60,
  audioSeconds: 120,
  videoBytes: 50 * 1024 * 1024,
  audioBytes: 10 * 1024 * 1024,
} as const;

export type MediaKind = "video" | "audio";

// Accepted types and the file extension each is stored under. These match
// the bucket's allowed list in supabase/add-testimonial-media.sql.
export const MEDIA_TYPES: Record<string, { kind: MediaKind; ext: string }> = {
  "video/mp4": { kind: "video", ext: "mp4" },
  "video/webm": { kind: "video", ext: "webm" },
  "video/quicktime": { kind: "video", ext: "mov" },
  "audio/mp4": { kind: "audio", ext: "m4a" },
  "audio/x-m4a": { kind: "audio", ext: "m4a" },
  "audio/webm": { kind: "audio", ext: "webm" },
  "audio/mpeg": { kind: "audio", ext: "mp3" },
  "audio/ogg": { kind: "audio", ext: "ogg" },
  "audio/aac": { kind: "audio", ext: "aac" },
  "audio/wav": { kind: "audio", ext: "wav" },
};

/** "video/webm;codecs=vp8" -> "video/webm", the form the bucket checks. */
export const baseMime = (type: string) => type.split(";")[0].trim().toLowerCase();
