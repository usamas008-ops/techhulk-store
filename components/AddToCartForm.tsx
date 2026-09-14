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
  const [variantId, setVariantId] = useState(hasVariants ? variants[0].id : "");
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
    <div className="space-y-6">
      {hasVariants && (
        <div>
          <p className="eyebrow text-slate">Choose option</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isActive = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={[
                    "rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors",
                    isActive
                      ? "border-night bg-night text-white"
                      : "border-hair bg-card text-graphite hover:border-slate",
                  ].join(" ")}
                >
                  {variant.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-5">
        <div>
          <p className="eyebrow text-slate">Quantity</p>
          <div className="mt-3 flex items-center border border-hair bg-card">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3.5 py-2.5 text-[15px] font-semibold text-graphite transition-colors hover:text-night"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-14 border-x border-hair bg-card py-2.5 text-center text-[13px] font-semibold text-night"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(quantity + 1)}
              className="px-3.5 py-2.5 text-[15px] font-semibold text-graphite transition-colors hover:text-night"
            >
              +
            </button>
          </div>
        </div>

        <p className="pb-3 text-[12px] text-slate">
          {outOfStock ? "Out of stock" : `${stock} in stock`}
        </p>
      </div>

      {outOfStock ? (
        <p className="rounded-full bg-hair py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate">
          Out of stock
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full border border-night px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-night transition-colors hover:bg-night hover:text-white"
          >
            {added ? "Added to cart" : "Add to cart"}
          </button>
          <button
            onClick={() => {
              handleAdd();
              router.push("/cart");
            }}
            className="flex-1 rounded-full bg-night px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-leaf"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
