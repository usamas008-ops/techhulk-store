import TestimonialManager from "@/components/admin/TestimonialManager";
import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const supabase = createClient();
  const [{ data: testimonials, error }, { data: products }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("id, name, city, body, rating, product_id, photo_url, source, is_published, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, title").order("title"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-paper">Testimonials</h1>
        <p className="mt-1 text-sm text-muted">
          What customers said about their orders. Shown ones appear on the home page under &ldquo;What our Customers Say&rdquo;.
        </p>
      </div>

      {error ? (
        <div className="max-w-2xl rounded-md border border-line bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-paper">One setup step left</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The testimonials table is not in Supabase yet. Open Supabase, go to SQL Editor, paste
            everything from <code className="text-paper">supabase/add-testimonials.sql</code> and
            click Run, then refresh this page.
          </p>
          <p className="mt-3 text-xs text-muted">Database message: {error.message}</p>
        </div>
      ) : (
        <TestimonialManager
          testimonials={(testimonials as Testimonial[]) || []}
          products={(products as { id: string; title: string }[]) || []}
        />
      )}
    </div>
  );
}
