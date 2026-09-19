"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { descriptionHtml } from "@/lib/format-description";
import { uploadProductImage } from "@/lib/upload-image";

// Description box with an "Add image" button. The picture is uploaded to
// Supabase Storage and placed where the cursor is, as ![](link) on its own line.
export default function DescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const supabase = createClient();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);

  const insertImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const at = textarea.current?.selectionStart ?? value.length;
    setUploading(true);
    setMessage("");
    const tokens: string[] = [];
    for (const file of Array.from(files)) {
      const { url, error } = await uploadProductImage(supabase, file);
      if (error) {
        setMessage(error);
        continue;
      }
      if (url) tokens.push(`![${file.name.replace(/\.[^.]+$/, "").replace(/[\[\]]/g, "")}](${url})`);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (tokens.length === 0) return;

    const before = value.slice(0, at).replace(/\s*$/, "");
    const after = value.slice(at).replace(/^\s*/, "");
    const block = tokens.join("\n\n");
    onChange([before, block, after].filter(Boolean).join("\n\n"));
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm text-muted">Description</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded-sm border border-line px-3 py-1 text-xs text-paper hover:border-signal disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Add image"}
          </button>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="rounded-sm border border-line px-3 py-1 text-xs text-paper hover:border-signal"
          >
            {preview ? "Hide preview" : "Preview"}
          </button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => insertImages(e.target.files)} />
      </div>

      <textarea
        ref={textarea}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-line bg-ink px-3 py-2 font-mono text-[13px] text-paper"
      />
      <p className="mt-1 text-xs text-muted">
        Plain text is fine. Leave an empty line between paragraphs. Click where the picture
        should go, then Add image.
      </p>
      {message && <p className="mt-1 text-sm text-danger">{message}</p>}

      {preview && (
        <div className="mt-3 rounded-sm bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8896AB]">
            How it looks on the store
          </p>
          {value.trim() ? (
            <div
              className="rich-text text-[13px] leading-relaxed text-[#464646]"
              dangerouslySetInnerHTML={{ __html: descriptionHtml(value) }}
            />
          ) : (
            <p className="text-sm text-[#8896AB]">Nothing written yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
