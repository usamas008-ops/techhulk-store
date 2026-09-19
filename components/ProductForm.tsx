"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DescriptionField from "@/components/DescriptionField";
import ProductImagesField from "@/components/ProductImagesField";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClass = "w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper";
const labelClass = "mb-1 block text-sm text-muted";

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    title: product?.title || "",
    handle: product?.handle || "",
    category: product?.category || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    stock: product?.stock?.toString() || "0",
    is_active: product?.is_active ?? true,
  });
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images : product?.image_url ? [product.image_url] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep an old free-text category selectable so editing never loses it.
  const options =
    form.category && !categories.some((c) => c.slug === form.category)
      ? [...categories, { slug: form.category, name: form.category }]
      : categories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      handle: slugify(form.handle) || slugify(form.title),
      category: form.category,
      description: form.description,
      image_url: images[0] || null,
      images,
      price: Number(form.price) || 0,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock) || 0,
      is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

    if (error) {
      setError(
        /duplicate key/i.test(error.message)
          ? "Another product already uses this URL handle. Change the handle and save again."
          : error.message
      );
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className={labelClass}>Title</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>URL handle, leave blank to make one from the title</label>
        <input
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          placeholder="e.g. air31-earbuds"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className={labelClass}>Category</label>
          <Link href="/admin/categories" className="text-xs text-signal hover:underline">
            Add or edit categories
          </Link>
        </div>
        <select
          required
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className={inputClass}
        >
          <option value="">Choose a category</option>
          {options.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <ProductImagesField images={images} onChange={setImages} />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Price (Rs.)</label>
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Old price, shows a discount</label>
          <input
            type="number"
            min={0}
            value={form.compare_at_price}
            onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Stock</label>
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <DescriptionField
        value={form.description}
        onChange={(description) => setForm({ ...form, description })}
      />

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
