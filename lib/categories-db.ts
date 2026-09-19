import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_ORDER, NAV_CATEGORIES, categoryLabel } from "@/lib/categories";

export type Category = {
  slug: string;
  name: string;
  sort_order: number;
  show_in_menu: boolean;
};

// Used until supabase/add-categories.sql has been run, so the store keeps
// working with the categories it started with.
const FALLBACK: Category[] = CATEGORY_ORDER.map((slug, index) => ({
  slug,
  name: categoryLabel(slug),
  sort_order: (index + 1) * 10,
  show_in_menu: NAV_CATEGORIES.includes(slug),
}));

/** All categories in menu order. Cached for the length of one request. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, sort_order, show_in_menu")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error || !data) return FALLBACK;
  return data as Category[];
});

/** slug -> display name, for components that only have the slug. */
export function labelsOf(categories: Category[]): Record<string, string> {
  return Object.fromEntries(categories.map((category) => [category.slug, category.name]));
}
