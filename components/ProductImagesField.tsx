"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/upload-image";

// Pasted links must come from a host next.config.js allows for next/image,
// otherwise the product page would fail to render the picture.
const ALLOWED_HOSTS = ["cdn.shopify.com", "techhulk.store", "images.unsplash.com"];
const allowedLink = (url: string) => {
  try {
    const host = new URL(url).hostname;
    return url.startsWith("https://") && (host.endsWith(".supabase.co") || ALLOWED_HOSTS.includes(host));
  } catch {
    return false;
  }
};

export default function ProductImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMessage("");
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const { url, error } = await uploadProductImage(supabase, file);
      if (error) {
        setMessage(error);
        continue;
      }
      if (url) added.push(url);
    }
    if (added.length) onChange([...images, ...added]);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const addLink = () => {
    const url = link.trim();
    if (!allowedLink(url)) {
      setMessage("Use Upload for this picture. Links only work from Supabase, Shopify or Unsplash.");
      return;
    }
    onChange([...images, url]);
    setLink("");
    setMessage("");
  };

  const makeMain = (index: number) => {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div>
      <label className="mb-1 block text-sm text-muted">Images</label>
      <p className="mb-3 text-xs text-muted">
        The first image is the main one on product cards. Up to 5 MB each.
      </p>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="overflow-hidden rounded-sm border border-line bg-white">
              <img src={src} alt="" className="aspect-square w-full object-contain" />
              <div className="flex items-center justify-between gap-1 bg-ink px-2 py-1.5 text-[11px]">
                {i === 0 ? (
                  <span className="font-semibold text-signal">Main</span>
                ) : (
                  <button type="button" onClick={() => makeMain(i)} className="text-paper hover:text-signal">
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  className="text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload from computer"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
        <div className="flex min-w-[240px] flex-1 gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="or paste an image link"
            className="w-full rounded-sm border border-line bg-ink px-3 py-2 text-sm text-paper"
          />
          <button
            type="button"
            onClick={addLink}
            className="rounded-sm border border-line px-3 py-2 text-sm text-paper hover:border-signal"
          >
            Add
          </button>
        </div>
      </div>

      {message && <p className="mt-2 text-sm text-danger">{message}</p>}
    </div>
  );
}
