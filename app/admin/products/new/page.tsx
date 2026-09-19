import ProductForm from "@/components/ProductForm";
import { getCategories } from "@/lib/categories-db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-paper">Add product</h1>
      <ProductForm categories={categories.map(({ slug, name }) => ({ slug, name }))} />
    </div>
  );
}
