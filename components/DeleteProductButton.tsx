"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteProductButton({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this product? This can't be undone. To hide it for a while instead, edit it and untick \"Visible in store\".")) {
      return;
    }
    setDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", productId);
    setDeleting(false);
    if (error) {
      alert(`Could not delete the product: ${error.message}`);
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-danger hover:underline disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
