"use client";

import { useEffect, useState } from "react";
import MediaRecorderField from "@/components/MediaRecorderField";
import { createClient } from "@/lib/supabase/client";
import { PHONE_HINT, normalizePakistaniMobile } from "@/lib/phone";
import { MEDIA_BUCKET, TESTIMONIAL_LIMITS, baseMime, type MediaKind } from "@/lib/testimonials";

const input = "w-full rounded-[12px] border border-[#dcdcdc] bg-white px-4 py-3 text-[14px] text-onyx placeholder:text-charcoal/40";
const label = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-slate";
type Mode = "text" | MediaKind;

async function call(payload: Record<string, unknown>) {
  const res = await fetch("/api/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
  return json;
}

export default function ShareExperienceForm() {
  const [step, setStep] = useState<"check" | "write" | "done">("check");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [mode, setMode] = useState<Mode>("video");
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // The confirmation email can link here as /share?order=<number>.
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("order");
    if (n && /^\d+$/.test(n)) setOrderNumber(n);
  }, []);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^#?\d+$/.test(orderNumber.trim())) return setError("Enter your order number, for example 12.");
    if (!normalizePakistaniMobile(phone)) return setError(PHONE_HINT);
    setBusy("Checking your order...");
    try {
      const json = await call({ action: "verify", orderNumber, phone });
      setProducts(json.products || []);
      if (json.products?.length === 1) setProductId(json.products[0].id);
      setName(json.name || "");
      setStep("write");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const withMedia = mode !== "text" && media;
    if (mode !== "text" && !media) return setError(mode === "video" ? "Record or choose a video first." : "Record or choose a voice message first.");
    if (mode === "text" && body.trim().length < 5) return setError("Write a few words about your order.");

    try {
      let mediaPath = "";
      if (withMedia) {
        setBusy(mode === "video" ? "Uploading your video..." : "Uploading your voice message...");
        const type = baseMime(media.type);
        const { path, token } = await call({ action: "upload", orderNumber, phone, kind: mode, type, size: media.size });
        const { error: upErr } = await createClient()
          .storage.from(MEDIA_BUCKET)
          .uploadToSignedUrl(path, token, media, { contentType: type, upsert: true });
        if (upErr) throw new Error("The upload failed. Check your connection and try again.");
        mediaPath = path;
      }
      setBusy("Sending...");
      await call({
        action: "submit", orderNumber, phone, body: body.trim(), rating: rating || null,
        name: name.trim(), productId, mediaPath, mediaKind: withMedia ? mode : null,
      });
      setStep("done");
    } catch (err: any) {
      setError(err.message === "Failed to fetch" ? "Could not reach the server. Check your connection." : err.message);
    } finally {
      setBusy("");
    }
  };

  if (step === "done") {
    return (
      <div className="rounded-[20px] bg-leaf/10 p-6 text-onyx">
        <p className="text-[17px] font-bold">Thank you for sharing!</p>
        <p className="mt-1 text-[14px] text-slate">We will put it on the site after we have had a look.</p>
      </div>
    );
  }

  if (step === "check") {
    return (
      <form onSubmit={check} className="space-y-4 rounded-[20px] bg-white p-5 sm:p-7">
        <p className="text-[14px] text-slate">
          First, your order. Your order number was shown when you ordered, and is in your confirmation email.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="share-order" className={label}>Order number *</label>
            <input id="share-order" inputMode="numeric" placeholder="12" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="share-phone" className={label}>Phone you ordered with *</label>
            <input id="share-phone" type="tel" inputMode="tel" placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
          </div>
        </div>
        {error && <p className="rounded-[12px] border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">{error}</p>}
        <button type="submit" disabled={Boolean(busy)} className="btn-buy btn-buy-lg disabled:opacity-50">{busy || "Continue"}</button>
      </form>
    );
  }

  const tabs: { key: Mode; text: string }[] = [
    { key: "video", text: "🎥 Video" },
    { key: "audio", text: "🎤 Voice" },
    { key: "text", text: "✍️ Write" },
  ];

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[20px] bg-white p-5 sm:p-7">
      <div>
        <span className={label}>How would you like to share?</span>
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setMode(t.key); setMedia(null); setError(""); }}
              className={`rounded-[12px] border-2 py-3 text-[13px] font-bold ${mode === t.key ? "border-onyx bg-onyx text-white" : "border-hair text-onyx"}`}
            >
              {t.text}
            </button>
          ))}
        </div>
      </div>

      {mode !== "text" && <MediaRecorderField key={mode} kind={mode} file={media} onChange={setMedia} />}

      <div>
        <label htmlFor="share-body" className={label}>{mode === "text" ? "Your words *" : "Anything to add? (optional)"}</label>
        <textarea id="share-body" rows={mode === "text" ? 4 : 2} maxLength={TESTIMONIAL_LIMITS.body} value={body} onChange={(e) => setBody(e.target.value)} placeholder="How was your order?" className={input} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.length > 1 && (
          <div>
            <label htmlFor="share-product" className={label}>Which product?</label>
            <select id="share-product" value={productId} onChange={(e) => setProductId(e.target.value)} className={input}>
              <option value="">The whole order</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="share-name" className={label}>Name to show</label>
          <input id="share-name" maxLength={TESTIMONIAL_LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
      </div>

      <div>
        <span className={label}>Stars (optional)</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(rating === n ? 0 : n)} className="p-0.5">
              <svg viewBox="0 0 20 20" className={`h-8 w-8 ${n <= rating ? "fill-gold" : "fill-[#dedede]"}`}><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" /></svg>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-[12px] border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">{error}</p>}
      <button type="submit" disabled={Boolean(busy)} className="btn-buy btn-buy-lg disabled:opacity-50">{busy || "Send"}</button>
    </form>
  );
}
