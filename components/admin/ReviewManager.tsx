"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/upload-image";
import { REVIEW_LIMITS, isVerifiedBuyer, reviewDate, type ProductReview } from "@/lib/reviews";

export type AdminReview = ProductReview & {
  products: { title: string; handle: string } | null;
  orders: { order_number: number } | null;
};

const inputClass = "w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper";
const labelClass = "mb-1 block text-sm text-muted";
const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

const EMPTY = { product_id: "", rating: "5", name: "", city: "", body: "", order: "", photos: [] as string[] };

export default function ReviewManager({
  reviews,
  products,
}: {
  reviews: AdminReview[];
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [filter, setFilter] = useState<Filter>(reviews.some((r) => r.status === "pending") ? "pending" : "approved");
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const count = (f: Filter) => (f === "all" ? reviews.length : reviews.filter((r) => r.status === f).length);
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const run = async (action: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    setMessage("");
    const { error } = await action();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return false;
    }
    router.refresh();
    return true;
  };

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, REVIEW_LIMITS.photos - form.photos.length);
    e.target.value = "";
    setUploading(true);
    setMessage("");
    const added: string[] = [];
    for (const file of files) {
      const { url, error } = await uploadProductImage(supabase, file);
      if (error) setMessage(error);
      if (url) added.push(url);
    }
    setUploading(false);
    setForm((f) => ({ ...f, photos: [...f.photos, ...added] }));
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) return setMessage("Choose the product.");
    if (!form.name.trim()) return setMessage("Add the customer's name.");
    if (form.body.trim().length < REVIEW_LIMITS.minBody) return setMessage("Add what the customer said.");

    // An order number makes this a verified review. The database refuses it
    // unless that order really contains the chosen product.
    let orderId: string | null = null;
    const orderNumber = form.order.trim().replace(/^#/, "");
    if (orderNumber) {
      if (!/^\d+$/.test(orderNumber)) return setMessage("Order number must be digits, for example 12.");
      const { data } = await supabase.from("orders").select("id").eq("order_number", Number(orderNumber)).maybeSingle();
      if (!data) return setMessage(`There is no order #${orderNumber}.`);
      orderId = data.id;
    }

    const ok = await run(() =>
      supabase.from("product_reviews").insert({
        product_id: form.product_id,
        order_id: orderId,
        name: form.name.trim(),
        city: form.city.trim() || null,
        rating: Number(form.rating),
        body: form.body.trim(),
        photo_urls: form.photos,
        status: "approved",
        added_by: "admin",
      })
    );
    if (ok) {
      setForm(EMPTY);
      setAdding(false);
      setFilter("approved");
    }
  };

  const setStatus = (r: AdminReview, status: ProductReview["status"]) =>
    run(() => supabase.from("product_reviews").update({ status }).eq("id", r.id));

  const remove = (r: AdminReview) => {
    if (!confirm(`Delete ${r.name}'s review? This cannot be undone.`)) return;
    run(() => supabase.from("product_reviews").delete().eq("id", r.id));
  };

  return (
    <div className="max-w-3xl space-y-6">
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="rounded-sm bg-signal px-5 py-2 font-semibold text-ink">
          + Add a review
        </button>
      ) : (
        <form onSubmit={add} className="space-y-4 rounded-md border border-line bg-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-paper">Add a review</h2>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-muted hover:text-paper">Cancel</button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            For a review a customer sent you on WhatsApp or by phone. Add their order number and it shows
            &ldquo;Verified buyer&rdquo; — only if that order contains this product. It goes live straight away.
          </p>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <label className={labelClass}>Product *</label>
              <select value={form.product_id} onChange={set("product_id")} className={inputClass}>
                <option value="">Choose…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stars *</label>
              <select value={form.rating} onChange={set("rating")} className={inputClass}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Customer name *</label>
              <input value={form.name} onChange={set("name")} maxLength={REVIEW_LIMITS.name} placeholder="Ali R." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input value={form.city} onChange={set("city")} maxLength={REVIEW_LIMITS.city} placeholder="Lahore" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Order number</label>
              <input value={form.order} onChange={set("order")} inputMode="numeric" placeholder="optional, e.g. 12" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>What they said *</label>
            <textarea value={form.body} onChange={set("body")} rows={4} maxLength={REVIEW_LIMITS.body} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Photos (up to {REVIEW_LIMITS.photos})</label>
            <div className="flex flex-wrap items-center gap-3">
              {form.photos.map((src) => (
                <div key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-20 rounded-sm border border-line object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, photos: form.photos.filter((p) => p !== src) })} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-danger text-xs text-white">×</button>
                </div>
              ))}
              {form.photos.length < REVIEW_LIMITS.photos && (
                <input type="file" accept="image/*" multiple onChange={onPhotos} disabled={uploading} className="text-sm text-paper" />
              )}
            </div>
            {uploading && <p className="mt-1 text-xs text-muted">Uploading…</p>}
          </div>

          <button type="submit" disabled={busy || uploading} className="rounded-sm bg-signal px-5 py-2 font-semibold text-ink disabled:opacity-50">
            Add review
          </button>
        </form>
      )}

      {message && <p className="text-sm text-danger">{message}</p>}

      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-sm px-3 py-1.5 capitalize ${filter === f ? "bg-paper font-semibold text-ink" : "border border-line text-paper hover:border-signal"}`}
          >
            {f} ({count(f)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-md border border-line bg-panel p-6 text-sm text-muted">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <div key={r.id} className="rounded-md border border-line bg-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-paper">{r.products?.title || "Deleted product"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="text-gold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    {" · "}{r.name}{r.city && `, ${r.city}`}{" · "}{reviewDate(r.created_at)}
                    {" · "}{r.added_by === "admin" ? "added by you" : "from customer"}
                  </p>
                  {isVerifiedBuyer(r) && (
                    <p className="mt-1 text-xs font-semibold text-signal">
                      Verified buyer{r.orders ? ` · order #${r.orders.order_number}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`capitalize ${r.status === "approved" ? "text-signal" : r.status === "pending" ? "text-yellow-400" : "text-muted"}`}>{r.status}</span>
                  {r.status !== "approved" && (
                    <button type="button" disabled={busy} onClick={() => setStatus(r, "approved")} className="font-semibold text-signal hover:underline">Approve</button>
                  )}
                  {r.status !== "rejected" && (
                    <button type="button" disabled={busy} onClick={() => setStatus(r, "rejected")} className="text-muted hover:text-paper">Reject</button>
                  )}
                  <button type="button" disabled={busy} onClick={() => remove(r)} className="text-danger hover:underline">Delete</button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-paper/90">{r.body}</p>
              {r.photo_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.photo_urls.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-16 w-16 rounded-sm border border-line object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
