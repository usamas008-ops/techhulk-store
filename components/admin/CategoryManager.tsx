"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/categories-db";

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const inputClass = "rounded-sm border border-line bg-ink px-3 py-2 text-paper";

type Result = { error: { message: string } | null };

export default function CategoryManager({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [inMenu, setInMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setNames(Object.fromEntries(categories.map((c) => [c.slug, c.name])));
  }, [categories]);

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

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    if (!slug) return setMessage("Type a category name first.");
    if (categories.some((c) => c.slug === slug)) return setMessage("That category already exists.");
    const sortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0) + 10;
    const ok = await run(() =>
      supabase.from("categories").insert({ slug, name: name.trim(), sort_order: sortOrder, show_in_menu: inMenu })
    );
    if (ok) {
      setName("");
      setInMenu(false);
    }
  };

  // Renumber everything in the new order so equal sort values cannot get stuck.
  const move = (index: number, direction: -1 | 1) => {
    const order = [...categories];
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    const updates = order
      .map((c, i) => ({ slug: c.slug, next: (i + 1) * 10, current: c.sort_order }))
      .filter((u) => u.next !== u.current)
      .map((u) => () => supabase.from("categories").update({ sort_order: u.next }).eq("slug", u.slug));
    run(...updates);
  };

  const remove = (category: Category) => {
    if (!confirm(`Delete the category "${category.name}"?`)) return;
    run(() => supabase.from("categories").delete().eq("slug", category.slug));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="rounded-md border border-line bg-panel p-5">
        <h2 className="font-display text-lg font-semibold text-paper">Add a category</h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm text-muted">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smart Glasses" className={`${inputClass} w-full`} />
            {slugify(name) && <p className="mt-1 text-xs text-muted">Store link: /collections/{slugify(name)}</p>}
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-paper">
            <input type="checkbox" checked={inMenu} onChange={(e) => setInMenu(e.target.checked)} />
            Show in top menu
          </label>
          <button type="submit" disabled={busy} className="rounded-sm bg-signal px-5 py-2 font-semibold text-ink disabled:opacity-50">
            Add category
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-danger">{message}</p>}

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Store link</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Top menu</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => {
              const draft = names[c.slug] ?? c.name;
              const used = counts[c.slug] || 0;
              return (
                <tr key={c.slug} className="border-t border-line text-paper">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" aria-label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)} className="rounded-sm border border-line px-2 py-0.5 disabled:opacity-30">↑</button>
                      <button type="button" aria-label="Move down" disabled={busy || i === categories.length - 1} onClick={() => move(i, 1)} className="rounded-sm border border-line px-2 py-0.5 disabled:opacity-30">↓</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input value={draft} onChange={(e) => setNames({ ...names, [c.slug]: e.target.value })} className={`${inputClass} w-44 py-1.5`} />
                      {draft.trim() && draft.trim() !== c.name && (
                        <button type="button" disabled={busy} onClick={() => run(() => supabase.from("categories").update({ name: draft.trim() }).eq("slug", c.slug))} className="text-signal hover:underline">Save</button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <a href={`/collections/${c.slug}`} target="_blank" rel="noreferrer" className="hover:underline">/collections/{c.slug}</a>
                  </td>
                  <td className="px-4 py-3">{used}</td>
                  <td className="px-4 py-3">
                    <button type="button" disabled={busy} onClick={() => run(() => supabase.from("categories").update({ show_in_menu: !c.show_in_menu }).eq("slug", c.slug))} className={c.show_in_menu ? "font-semibold text-signal" : "text-muted"}>
                      {c.show_in_menu ? "Shown" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {used ? (
                      <span className="text-xs text-muted" title="Move or delete its products first">In use</span>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => remove(c)} className="text-danger hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        A category that still has products cannot be deleted. Edit those products and choose another category first.
      </p>
    </div>
  );
}
