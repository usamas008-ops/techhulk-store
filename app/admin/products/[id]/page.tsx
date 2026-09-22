import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/categories-db";
import { getDeliverySettings } from "@/lib/settings-db";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: product }, categories, delivery] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    getCategories(),
    getDeliverySettings(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-paper">Edit product</h1>
      <ProductForm
        product={product}
        categories={categories.map(({ slug, name }) => ({ slug, name }))}
        defaultDeliveryFee={delivery.defaultFee}
      />
    </div>
  );
}
