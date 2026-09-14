"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

const fields = [
  ["customer_name", "Full name", "Ali Raza"],
  ["phone", "Phone number", "03xx xxxxxxx"],
  ["address", "Address", "House, street, area"],
  ["city", "City", "Lahore"],
] as const;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0 && !submitting) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-3 text-[13px] text-slate">
          Add something to the cart before checking out.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items, subtotal }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Order failed");

      clear();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err: any) {
      setError(
        err.message === "Failed to fetch"
          ? "Could not reach the server. Check your connection and try again."
          : err.message || "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-hair bg-card px-3.5 py-2.5 text-[13px] text-night placeholder:text-slate/60";

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
      <form onSubmit={handleSubmit}>
        <h1 className="section-title mb-5 border-b border-hair pb-3">
          Delivery details
        </h1>

        <div className="space-y-4">
          {fields.map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="eyebrow mb-2 block text-slate">{label}</label>
              <input
                required
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
              />
            </div>
          ))}

          <div>
            <label className="eyebrow mb-2 block text-slate">
              Notes, optional
            </label>
            <textarea
              rows={3}
              placeholder="Nearest landmark, delivery timing, anything else"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5 border border-hair bg-card p-4">
          <p className="eyebrow text-slate">Payment method</p>
          <p className="mt-1 text-[13px] font-semibold text-night">
            Cash on Delivery
          </p>
          <p className="mt-1 text-[12px] text-slate">
            Pay the courier in cash when your parcel arrives. No advance
            payment.
          </p>
        </div>

        {error && (
          <p className="mt-4 border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-night px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-leaf disabled:opacity-50"
        >
          {submitting ? "Placing order..." : "Place order, pay on delivery"}
        </button>
      </form>

      <div className="h-fit border border-hair bg-card p-6">
        <p className="eyebrow text-night">Order summary</p>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="flex justify-between gap-3 text-[12px]"
            >
              <span className="text-slate">
                {item.title}
                {item.variantTitle ? ` (${item.variantTitle})` : ""} x
                {item.quantity}
              </span>
              <span className="whitespace-nowrap font-semibold text-night">
                Rs.{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-hair pt-4 text-[13px] text-graphite">
          <span>Delivery</span>
          <span className="font-semibold text-leaf">Free</span>
        </div>
        <div className="mt-2 flex justify-between text-[15px] font-bold text-night">
          <span>Total</span>
          <span>Rs.{subtotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
