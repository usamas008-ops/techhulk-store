"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/upload-image";
import { TESTIMONIAL_LIMITS, TESTIMONIAL_SOURCES, type Testimonial } from "@/lib/testimonials";

const inputClass = "w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper";
const labelClass = "mb-1 block text-sm text-muted";

type Result = { error: { message: string } | null };
type Draft = {
  id: string | null;
  name: string;
  city: string;
  body: string;
  rating: string;
  product_id: string;
  source: string;
  photo_url: string;
  is_published: boolean;
};

const EMPTY: Draft = {
  id: null, name: "", city: "", body: "", rating: "", product_id: "",
  source: "whatsapp", photo_url: "", is_published: true,
};

const starsText = (rating: number | null) =>
  rating ? "★".repeat(rating) + "☆".repeat(5 - rating) : "no stars";

export default function TestimonialManager({
  testimonials,
  products,
}: {
  testimonials: Testimonial[];
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const productTitle = Object.fromEntries(products.map((p) => [p.id, p.title]));

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const run = async (...actions: (() => PromiseLike<Result>)[]) => {
    setBusy(true);
    setMessage("");
    for (const action of actions) {
      const { error } = await action();
      if (error) {
        setBusy(false);
        setMessage(error.message);
        return false;
      }
    }
    setBusy(false);
    router.refresh();
    return true;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setMessage("Add the customer's name.");
    if (!form.body.trim()) return setMessage("Add what the customer said.");

    const payload = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      body: form.body.trim(),
      rating: form.rating ? Number(form.rating) : null,
      product_id: form.product_id || null,
      source: form.source || null,
      photo_url: form.photo_url || null,
      is_published: form.is_published,
    };

    const ok = form.id
      ? await run(() => supabase.from("testimonials").update(payload).eq("id", form.id as string))
      : await run(() =>
          supabase.from("testimonials").insert({
            ...payload,
            sort_order: testimonials.reduce((max, t) => Math.max(max, t.sort_order), 0) + 10,
          })
        );
    if (ok) setForm(EMPTY);
  };

  const edit = (t: Testimonial) => {
    setMessage("");
    setForm({
      id: t.id,
      name: t.name,
      city: t.city || "",
      body: t.body,
      rating: t.rating ? String(t.rating) : "",
      product_id: t.product_id || "",
      source: t.source || "",
      photo_url: t.photo_url || "",
      is_published: t.is_published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage("");
    const { url, error } = await uploadProductImage(supabase, file);
    setUploading(false);
    if (error) return setMessage(error);
    if (url) setForm((f) => ({ ...f, photo_url: url }));
  };

  // Renumber everything in the new order so equal sort values cannot get stuck.
  const move = (index: number, direction: -1 | 1) => {
    const order = [...testimonials];
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    run(
      ...order
        .map((t, i) => ({ id: t.id, next: (i + 1) * 10, current: t.sort_order }))
        .filter((u) => u.next !== u.current)
        .map((u) => () => supabase.from("testimonials").update({ sort_order: u.next }).eq("id", u.id))
    );
  };

  const remove = (t: Testimonial) => {
    if (!confirm(`Delete ${t.name}'s testimonial? This cannot be undone.`)) return;
    if (form.id === t.id) setForm(EMPTY);
    run(() => supabase.from("testimonials").delete().eq("id", t.id));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="max-w-3xl space-y-4 rounded-md border border-line bg-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-paper">
            {form.id ? "Edit testimonial" : "Add a testimonial"}
          </h2>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY)} className="text-sm text-muted hover:text-paper">
              Cancel editing
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Only add what a real customer actually said or wrote, and ask before showing their name. A
          first name and initial, like &ldquo;Ali R.&rdquo;, is enough. Leave the stars empty unless
          the customer gave a rating themselves.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Customer name *</label>
            <input value={form.name} onChange={set("name")} maxLength={TESTIMONIAL_LIMITS.name} placeholder="Ali R." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input value={form.city} onChange={set("city")} maxLength={TESTIMONIAL_LIMITS.city} placeholder="Lahore" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>What they said *</label>
          <textarea
            value={form.body}
            onChange={set("body")}
            rows={4}
            maxLength={TESTIMONIAL_LIMITS.body}
            placeholder="Paste their message here, in their own words."
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-muted">
            {form.body.length}/{TESTIMONIAL_LIMITS.body}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Stars</label>
            <select value={form.rating} onChange={set("rating")} className={inputClass}>
              <option value="">No stars</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Where it came from</label>
            <select value={form.source} onChange={set("source")} className={inputClass}>
              <option value="">Not shown</option>
              {Object.entries(TESTIMONIAL_SOURCES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Product they bought</label>
            <select value={form.product_id} onChange={set("product_id")} className={inputClass}>
              <option value="">Not shown</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Photo (optional)</label>
          <p className="mb-2 text-xs text-muted">The customer with the product, or a screenshot of their message.</p>
          {form.photo_url ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.photo_url} alt="" className="h-24 w-24 rounded-sm border border-line object-contain" />
              <button type="button" onClick={() => setForm({ ...form, photo_url: "" })} className="text-sm text-danger hover:underline">
                Remove photo
              </button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={onPhoto} disabled={uploading} className="text-sm text-paper" />
          )}
          {uploading && <p className="mt-1 text-xs text-muted">Uploading...</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-paper">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Show on the store
        </label>

        <button type="submit" disabled={busy || uploading} className="rounded-sm bg-signal px-5 py-2 font-semibold text-ink disabled:opacity-50">
          {form.id ? "Save changes" : "Add testimonial"}
        </button>
      </form>

      {message && <p className="text-sm text-danger">{message}</p>}

      {testimonials.length === 0 ? (
        <p className="max-w-3xl rounded-md border border-line bg-panel p-6 text-sm text-muted">
          No testimonials yet. The section stays hidden on the store until you add the first one.
        </p>
      ) : (
        <div className="max-w-3xl space-y-3">
          {testimonials.map((t, i) => (
            <div key={t.id} className={`rounded-md border border-line bg-panel p-4 ${t.is_published ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-paper">
                    {t.name}
                    {t.city && <span className="font-normal text-muted"> · {t.city}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="text-gold">{starsText(t.rating)}</span>
                    {t.source && ` · via ${TESTIMONIAL_SOURCES[t.source] || t.source}`}
                    {t.product_id && productTitle[t.product_id] && ` · ${productTitle[t.product_id]}`}
                    {t.photo_url && " · has photo"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button type="button" aria-label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)} className="rounded-sm border border-line px-2 py-0.5 text-paper disabled:opacity-30">↑</button>
                  <button type="button" aria-label="Move down" disabled={busy || i === testimonials.length - 1} onClick={() => move(i, 1)} className="rounded-sm border border-line px-2 py-0.5 text-paper disabled:opacity-30">↓</button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => supabase.from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id))}
                    className={t.is_published ? "font-semibold text-signal" : "text-muted"}
                  >
                    {t.is_published ? "Shown" : "Hidden"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => edit(t)} className="text-paper hover:underline">Edit</button>
                  <button type="button" disabled={busy} onClick={() => remove(t)} className="text-danger hover:underline">Delete</button>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-paper/90">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">New and changed testimonials reach the home page within a minute.</p>
    </div>
  );
}
