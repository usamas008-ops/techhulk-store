"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

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
      <div className="container-page py-16 text-center text-muted">
        Your cart is empty.
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
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Delivery details
        </h1>

        {(
          [
            ["customer_name", "Full name"],
            ["phone", "Phone number"],
            ["address", "Address"],
            ["city", "City"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1 block text-sm text-muted">{label}</label>
            <input
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
            />
          </div>
        ))}

        <div>
          <label className="mb-1 block text-sm text-muted">
            Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
            rows={3}
          />
        </div>

        <div className="rounded-sm border border-line bg-panel p-4 text-sm text-muted">
          Payment method: <span className="text-paper">Cash on Delivery</span>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-signal px-6 py-3 font-semibold text-ink hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Placing order..." : "Place order (Cash on Delivery)"}
        </button>
      </form>

      <div className="h-fit space-y-3 rounded-md border border-line bg-panel p-6">
        <h2 className="font-display text-lg font-semibold text-paper">
          Order summary
        </h2>
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex justify-between text-sm text-muted"
          >
            <span>
              {item.title} × {item.quantity}
            </span>
            <span className="text-paper">
              Rs. {(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 font-semibold text-paper">
          <span>Total</span>
          <span>Rs. {subtotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
