import { createClient } from "@/lib/supabase/server";
import type { ProductReview } from "@/lib/reviews";

/**
 * Approved reviews for one product, newest first. Before
 * supabase/add-product-reviews.sql is run the table does not exist; that
 * comes back as an empty list and the product page simply shows no reviews.
 */
export async function getApprovedReviews(productId: string): Promise<ProductReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, order_id, name, city, rating, body, photo_urls, status, added_by, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as ProductReview[];
}
