"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Your cart is empty
        </h1>
        <Link
          href="/"
          className="mt-4 inline-block rounded-sm bg-signal px-6 py-3 font-semibold text-ink"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Your cart
        </h1>
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex gap-4 rounded-md border border-line bg-panel p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-ink">
              {item.image && (
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="text-paper">{item.title}</p>
                {item.variantTitle && (
                  <p className="text-sm text-muted">{item.variantTitle}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    setQuantity(
                      item.productId,
                      item.variantId,
                      Math.max(1, Number(e.target.value))
                    )
                  }
                  className="w-16 rounded-sm border border-line bg-ink px-2 py-1 text-paper"
                />
                <span className="font-semibold text-signal">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              className="self-start text-sm text-danger hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit space-y-4 rounded-md border border-line bg-panel p-6">
        <div className="flex justify-between text-paper">
          <span>Subtotal</span>
          <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
        </div>
        <p className="text-sm text-muted">
          Delivery charges calculated at checkout. Cash on Delivery only.
        </p>
        <Link
          href="/checkout"
          className="block rounded-sm bg-signal px-6 py-3 text-center font-semibold text-ink hover:opacity-90"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
