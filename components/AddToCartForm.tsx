"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product, ProductVariant } from "@/lib/types";

export default function AddToCartForm({
  product,
  variants,
}: {
  product: Product;
  variants: ProductVariant[];
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState(
    hasVariants ? variants[0].id : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const price = selectedVariant ? selectedVariant.price : product.price;
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const outOfStock = stock <= 0;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : null,
      title: product.title,
      variantTitle: selectedVariant?.title,
      price,
      image: product.image_url,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-4">
      {hasVariants && (
        <div>
          <label className="mb-1 block text-sm text-muted">Variant</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} — Rs. {v.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-muted">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-24 rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      {outOfStock ? (
        <p className="font-medium text-danger">Out of stock</p>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            className="rounded-sm bg-signal px-6 py-3 font-semibold text-ink transition-opacity hover:opacity-90"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
          <button
            onClick={() => {
              handleAdd();
              router.push("/cart");
            }}
            className="rounded-sm border border-line px-6 py-3 font-semibold text-paper hover:border-signal"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
