"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteProductButton({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("Delete this product? This can't be undone.")) return;
    await supabase.from("products").delete().eq("id", productId);
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="text-danger hover:underline">
      Delete
    </button>
  );
}
