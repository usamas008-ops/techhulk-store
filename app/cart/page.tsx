"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { cartDeliveryFee, deliveryLabel } from "@/lib/delivery";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useCart();
  const delivery = cartDeliveryFee(items);
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-3 text-[13px] text-slate">
          Add a gadget and it will show up here.
        </p>
        <Link
          href="/"
          className="mt-7 btn-buy btn-buy-lg"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="section-title mb-5 border-b border-hair pb-3">
          Your cart
        </h1>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="flex gap-4 rounded-[18px] bg-white p-3.5"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[14px] bg-[#f6f6f6]">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="96px"
                    className="object-contain p-1.5"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3">
                <div>
                  <p className="line-clamp-2 text-[13px] font-semibold text-night">
                    {item.title}
                  </p>
                  {item.variantTitle && (
                    <p className="mt-1 text-[12px] text-slate">
                      {item.variantTitle}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-slate">
                    Rs.{item.price.toLocaleString()} each
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center overflow-hidden rounded-[10px] border border-[#dcdcdc]">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.variantId,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      className="px-3 py-1.5 text-[14px] font-semibold text-graphite transition-colors hover:text-night"
                    >
                      -
                    </button>
                    <span className="w-10 border-x border-hair py-1.5 text-center text-[12px] font-semibold text-night">
                      {item.quantity}
                    </span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity + 1
                        )
                      }
                      className="px-3 py-1.5 text-[14px] font-semibold text-graphite transition-colors hover:text-night"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[15px] font-bold text-night">
                    Rs.{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="self-start text-[11px] font-bold uppercase tracking-[0.1em] text-slate transition-colors hover:text-sale"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-fit rounded-[24px] bg-white p-6">
        <p className="eyebrow text-night">Order summary</p>

        <div className="mt-4 flex justify-between text-[13px] text-graphite">
          <span>Subtotal</span>
          <span className="font-semibold text-night">
            Rs.{subtotal.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-graphite">
          <span>Delivery</span>
          <span className={delivery > 0 ? "font-semibold text-night" : "font-semibold text-leaf"}>
            {deliveryLabel(delivery)}
          </span>
        </div>
        <div className="mt-4 flex justify-between border-t border-hair pt-4 text-[15px] font-bold text-night">
          <span>Total</span>
          <span>Rs.{total.toLocaleString()}</span>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-slate">
          Cash on Delivery only. Pay the courier when your parcel arrives.
        </p>

        <Link
          href="/checkout"
          className="mt-5 w-full btn-buy btn-buy-lg"
        >
          Proceed to checkout
        </Link>
        <Link
          href="/"
          className="mt-3 block text-center text-[11px] font-bold uppercase tracking-[0.1em] text-slate transition-colors hover:text-night"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
