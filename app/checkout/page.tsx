"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { PHONE_HINT, PHONE_REQUIRED, normalizePakistaniMobile } from "@/lib/phone";
import { getAttribution } from "@/lib/attribution";
import { cartDeliveryFee, deliveryLabel } from "@/lib/delivery";

const baseInput =
  "w-full rounded-[12px] border bg-white px-4 py-3 text-[14px] text-onyx placeholder:text-charcoal/40";

function Label({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="eyebrow mb-2 block text-slate">
      {children}
      {required && <span className="text-sale"> *</span>}
    </label>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const delivery = cartDeliveryFee(items);
  const total = subtotal + delivery;
  const router = useRouter();
  const phoneInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", address: "", city: "", notes: "" });
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0 && !submitting) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-3 text-[13px] text-slate">Add something to the cart before checking out.</p>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Only the phone number is compulsory: no valid mobile number, no order.
    // Name, address and city are optional and can be collected on the call.
    const phone = normalizePakistaniMobile(form.phone);
    if (!phone) {
      setPhoneError(form.phone.trim() ? PHONE_HINT : PHONE_REQUIRED);
      phoneInput.current?.focus();
      return;
    }

    const customer = {
      customer_name: form.customer_name.trim(),
      phone,
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items, subtotal, attribution: getAttribution() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      clear();
      router.push(data.orderNumber ? `/checkout/success?order=${data.orderNumber}` : "/checkout/success");
    } catch (err: any) {
      setError(
        err.message === "Failed to fetch"
          ? "Could not reach the server. Check your connection and try again."
          : err.message || "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={handleSubmit} noValidate={false}>
        <h1 className="section-title mb-5 border-b border-hair pb-3">Delivery details</h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="checkout-name">Full name</Label>
            <input id="checkout-name" autoComplete="name" placeholder="Ali Raza" value={form.customer_name} onChange={set("customer_name")} className={`${baseInput} border-[#dcdcdc]`} />
          </div>

          <div>
            <Label htmlFor="checkout-phone" required>Phone number</Label>
            <input
              id="checkout-phone"
              ref={phoneInput}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={17}
              placeholder="03001234567"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (phoneError && normalizePakistaniMobile(e.target.value)) setPhoneError("");
              }}
              onBlur={() => {
                if (form.phone.trim() && !normalizePakistaniMobile(form.phone)) setPhoneError(PHONE_HINT);
              }}
              aria-invalid={Boolean(phoneError)}
              aria-describedby="checkout-phone-help"
              className={`${baseInput} ${phoneError ? "border-sale bg-sale/5" : "border-[#dcdcdc]"}`}
            />
            <p id="checkout-phone-help" className={`mt-1.5 text-[12px] ${phoneError ? "font-semibold text-sale" : "text-slate"}`}>
              {phoneError || "We call this number to confirm your order."}
            </p>
          </div>

          <div>
            <Label htmlFor="checkout-email">Email</Label>
            {/* Optional, and type="email" only nudges a typo: an empty box
                passes, so this never stands between a shopper and an order. */}
            <input
              id="checkout-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ali@gmail.com"
              value={form.email}
              onChange={set("email")}
              aria-describedby="checkout-email-help"
              className={`${baseInput} border-[#dcdcdc]`}
            />
            <p id="checkout-email-help" className="mt-1.5 text-[12px] text-slate">
              Optional. We call you on the phone number above either way.
            </p>
          </div>

          <div>
            <Label htmlFor="checkout-address">Address</Label>
            <input id="checkout-address" autoComplete="street-address" placeholder="House, street, area" value={form.address} onChange={set("address")} className={`${baseInput} border-[#dcdcdc]`} />
          </div>

          <div>
            <Label htmlFor="checkout-city">City</Label>
            <input id="checkout-city" autoComplete="address-level2" placeholder="Lahore" value={form.city} onChange={set("city")} className={`${baseInput} border-[#dcdcdc]`} />
          </div>

          <div>
            <label htmlFor="checkout-notes" className="eyebrow mb-2 block text-slate">Notes, optional</label>
            <textarea id="checkout-notes" rows={3} placeholder="Nearest landmark, delivery timing, anything else" value={form.notes} onChange={set("notes")} className={`${baseInput} border-[#dcdcdc]`} />
          </div>
        </div>

        <div className="mt-5 rounded-[18px] bg-white p-5">
          <p className="eyebrow text-slate">Payment method</p>
          <p className="mt-1 text-[13px] font-semibold text-night">Cash on Delivery</p>
          <p className="mt-1 text-[12px] text-slate">Pay the courier in cash when your parcel arrives. No advance payment.</p>
        </div>

        {error && (
          <p className="mt-4 rounded-[12px] border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="mt-5 w-full btn-buy btn-buy-lg disabled:opacity-50">
          {submitting ? "Placing order..." : "Place order, pay on delivery"}
        </button>
      </form>

      <div className="h-fit rounded-[24px] bg-white p-6">
        <p className="eyebrow text-night">Order summary</p>
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
              {/* Same picture as in the cart, with the quantity on its corner. */}
              <div className="relative h-14 w-14 shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-[12px] border border-hair bg-[#f6f6f6]">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill sizes="56px" className="object-contain p-1" />
                  )}
                </div>
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-onyx px-1 text-[10px] font-bold text-white">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-night">{item.title}</p>
                {item.variantTitle && <p className="mt-0.5 text-[11.5px] text-slate">{item.variantTitle}</p>}
              </div>
              <span className="whitespace-nowrap text-[12.5px] font-semibold text-night">
                Rs.{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-hair pt-4 text-[13px] text-graphite">
          <span>Subtotal</span>
          <span className="font-semibold text-night">Rs.{subtotal.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-graphite">
          <span>Delivery</span>
          <span className={delivery > 0 ? "font-semibold text-night" : "font-semibold text-leaf"}>
            {deliveryLabel(delivery)}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[15px] font-bold text-night">
          <span>Total</span>
          <span>Rs.{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
