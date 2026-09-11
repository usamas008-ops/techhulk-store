import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-paper">
        Add product
      </h1>
      <ProductForm />
    </div>
  );
}
