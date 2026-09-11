import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteProductButton from "@/components/DeleteProductButton";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title, price, stock, is_active, category")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-paper">
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-sm bg-signal px-4 py-2 font-semibold text-ink"
        >
          + Add product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p) => (
              <tr key={p.id} className="border-t border-line text-paper">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 text-muted">{p.category}</td>
                <td className="px-4 py-3">Rs. {Number(p.price).toLocaleString()}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.is_active ? "text-signal" : "text-muted"
                    }
                  >
                    {p.is_active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="mr-3 text-signal hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteProductButton productId={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
