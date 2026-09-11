"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportProductsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleImport = async () => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/import-products", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(`Imported ${data.imported} of ${data.total} products.`);
      router.refresh();
    } catch (err: any) {
      setResult(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-line bg-panel p-6">
      <h2 className="mb-2 font-display text-lg font-semibold text-paper">
        Import catalog from techhulk.store
      </h2>
      <p className="mb-4 text-sm text-muted">
        Pulls the current product list, prices and images from the source
        store and adds or updates them here. Safe to run again later.
      </p>
      <button
        onClick={handleImport}
        disabled={loading}
        className="rounded-sm bg-signal px-5 py-2.5 font-semibold text-ink disabled:opacity-50"
      >
        {loading ? "Importing..." : "Import products now"}
      </button>
      {result && <p className="mt-3 text-sm text-paper">{result}</p>}
    </div>
  );
}
