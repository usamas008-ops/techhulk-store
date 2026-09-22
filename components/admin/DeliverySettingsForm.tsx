"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The store-wide delivery charge, used by every product that does not carry
// its own. Lives in the single row of the settings table.
export default function DeliverySettingsForm({ defaultFee }: { defaultFee: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [fee, setFee] = useState(String(defaultFee));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { error: writeError } = await supabase
      .from("settings")
      .update({ default_delivery_fee: Number(fee) || 0, updated_at: new Date().toISOString() })
      .eq("id", true);

    setSaving(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <label className="mb-1 block text-sm text-muted" htmlFor="default-delivery-fee">
        Delivery charge (Rs.)
      </label>
      <input
        id="default-delivery-fee"
        type="number"
        min={0}
        value={fee}
        onChange={(e) => {
          setFee(e.target.value);
          setSaved(false);
        }}
        className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-paper"
      />
      <p className="text-xs text-muted">
        0 means the whole store has free delivery. Any product can be set to free, or given its own
        charge, on its own page under Products.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-paper px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-leaf">Saved</span>}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
