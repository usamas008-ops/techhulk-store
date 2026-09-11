"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newStatus: string) => {
    setValue(newStatus);
    setSaving(true);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setSaving(false);
    router.refresh();
  };

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="rounded-sm border border-line bg-ink px-3 py-2 capitalize text-paper"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
