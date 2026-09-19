import type { SupabaseClient } from "@supabase/supabase-js";

// Product pictures live in the public Supabase Storage bucket created by
// supabase/add-analytics-and-image-uploads.sql. Only admins can upload.
export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "image"}.${ext || "jpg"}`;
}

export async function uploadProductImage(
  supabase: SupabaseClient,
  file: File
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) return { error: `${file.name} is not a picture.` };
  if (file.size > MAX_IMAGE_BYTES) return { error: `${file.name} is bigger than 5 MB, so it was skipped.` };

  const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });

  if (error) {
    return {
      error: /bucket|not found/i.test(error.message)
        ? "Image upload is not set up yet. Run supabase/add-analytics-and-image-uploads.sql in Supabase first."
        : `Upload failed: ${error.message}`,
    };
  }
  return { url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl };
}
