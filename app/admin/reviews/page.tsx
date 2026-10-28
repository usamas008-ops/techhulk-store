import ReviewManager, { type AdminReview } from "@/components/admin/ReviewManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const supabase = createClient();
  const [{ data: reviews, error }, { data: products }] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("id, product_id, order_id, name, city, rating, body, photo_urls, status, added_by, created_at, products(title, handle), orders(order_number)")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("products").select("id, title").order("title"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Product reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Reviews shown on each product&apos;s page. Customers&apos; reviews wait here until you approve them.
          &ldquo;Verified buyer&rdquo; appears only on a review tied to a real order for that product.
        </p>
      </div>

      {error ? (
        <div className="max-w-2xl rounded-md border border-line bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-paper">One setup step left</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The product reviews table is not in Supabase yet. Open Supabase, go to SQL Editor, paste
            everything from <code className="text-paper">supabase/add-product-reviews.sql</code> and
            click Run, then refresh this page.
          </p>
          <p className="mt-3 text-xs text-muted">Database message: {error.message}</p>
        </div>
      ) : (
        <ReviewManager
          reviews={(reviews as unknown as AdminReview[]) || []}
          products={(products as { id: string; title: string }[]) || []}
        />
      )}
    </div>
  );
}
