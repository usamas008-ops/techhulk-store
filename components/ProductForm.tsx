"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    title: product?.title || "",
    handle: product?.handle || "",
    category: product?.category || "",
    description: product?.description || "",
    image_url: product?.image_url || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    stock: product?.stock?.toString() || "0",
    is_active: product?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      handle: form.handle || slugify(form.title),
      category: form.category,
      description: form.description,
      image_url: form.image_url || null,
      price: Number(form.price) || 0,
      compare_at_price: form.compare_at_price
        ? Number(form.compare_at_price)
        : null,
      stock: Number(form.stock) || 0,
      is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Title</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Handle (URL slug — leave blank to auto-generate)
        </label>
        <input
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          placeholder="e.g. air31-earbuds"
          className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Category</label>
        <input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Image URL</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Price (Rs.)</label>
          <input
            required
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Compare-at price
          </label>
          <input
            type="number"
            value={form.compare_at_price}
            onChange={(e) =>
              setForm({ ...form, compare_at_price: e.target.value })
            }
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Stock</label>
          <input
            required
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-paper">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Visible in store
      </label>

      {error && <p className="text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-signal px-6 py-3 font-semibold text-ink disabled:opacity-50"
      >
        {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
