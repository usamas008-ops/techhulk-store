"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { track } from "@/lib/track";
import type { Product, ProductVariant } from "@/lib/types";

export default function AddToCartForm({
  product,
  variants,
  deliveryFee = 0,
}: {
  product: Product;
  variants: ProductVariant[];
  deliveryFee?: number;
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
      deliveryFee,
    });
    track("add_to_cart", { productId: product.id });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-6">
      {hasVariants && (
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-charcoal">
            Choose option
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isActive = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={[
                    "rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors",
                    isActive
                      ? "border-onyx bg-onyx text-white"
                      : "border-[#dcdcdc] bg-white text-charcoal hover:border-charcoal",
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
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-charcoal">
            Quantity
          </p>
          <div className="mt-3 flex items-center overflow-hidden rounded-[12px] border border-[#dcdcdc] bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2.5 text-[16px] font-semibold text-charcoal transition-colors hover:bg-[#f3f2f2]"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 border-x border-[#dcdcdc] bg-white py-2.5 text-center text-[14px] font-semibold text-onyx"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2.5 text-[16px] font-semibold text-charcoal transition-colors hover:bg-[#f3f2f2]"
            >
              +
            </button>
          </div>
        </div>

        <p className="pb-3 text-[12.5px] font-medium text-charcoal/70">
          {outOfStock ? "Out of stock" : `${stock} in stock`}
        </p>
      </div>

      {outOfStock ? (
        <p className="rounded-[12px] bg-[#ececec] py-4 text-center text-[13px] font-bold uppercase tracking-[0.08em] text-charcoal/60">
          Out of stock
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-[12px] border-2 border-onyx px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-onyx transition-colors hover:bg-onyx hover:text-white"
          >
            {added ? "Added to cart" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={() => {
              handleAdd();
              router.push("/cart");
            }}
            className="btn-buy btn-buy-lg flex-1"
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
