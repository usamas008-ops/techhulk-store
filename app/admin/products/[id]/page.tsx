import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-paper">
        Edit product
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
