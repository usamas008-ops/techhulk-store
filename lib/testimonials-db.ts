import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/testimonials";

/**
 * Published testimonials in the admin's order. Before
 * supabase/add-testimonials.sql is run the table does not exist; that comes
 * back as an empty list, and the storefront section simply does not appear.
 */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient();
  const withMedia = await supabase
    .from("testimonials")
    .select("id, name, city, body, rating, product_id, photo_url, source, is_published, sort_order, created_at, video_url, audio_url, order_id, submitted_by")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(24);
  if (!withMedia.error && withMedia.data) return withMedia.data as Testimonial[];

  // Before supabase/add-testimonial-media.sql the new columns do not exist;
  // read the original ones so the section keeps working meanwhile.
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, name, city, body, rating, product_id, photo_url, source, is_published, sort_order, created_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(24);
  if (error || !data) return [];
  return data as Testimonial[];
}
