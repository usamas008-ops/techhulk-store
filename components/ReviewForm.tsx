"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { PHONE_HINT, normalizePakistaniMobile } from "@/lib/phone";
import { REVIEW_LIMITS } from "@/lib/reviews";

const input =
  "w-full rounded-[12px] border border-[#dcdcdc] bg-white px-4 py-3 text-[14px] text-onyx placeholder:text-charcoal/40";
const label = "mb-1.5 block text-[12px] font-bold uppercase tracking-[0.06em] text-slate";

type Photo = { file: File; url: string };

// "Write a review" on a product page. The order number and phone are what
// prove the shopper bought it; /api/reviews checks both, and the review then
// waits for the shop's approval in /admin/reviews.
export default function ReviewForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // The order confirmation email links here as ?review=<order number>.
  // Read from window rather than useSearchParams so the page stays static.
  useEffect(() => {
    const fromEmail = new URLSearchParams(window.location.search).get("review");
    if (fromEmail || window.location.hash === "#write-review") {
      if (fromEmail && /^\d+$/.test(fromEmail)) setOrderNumber(fromEmail);
      setOpen(true);
      setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, []);

  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = REVIEW_LIMITS.photos - photos.length;
    const picked = await Promise.all(files.slice(0, room).map((f) => compressImage(f)));
    const added = picked.map((file) => ({ file, url: URL.createObjectURL(file) }));
    urls.current.push(...added.map((p) => p.url));
    setPhotos((prev) => [...prev, ...added]);
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    setPhotos((prev) => prev.filter((p) => p.url !== url));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Tap the stars to give a rating.");
    if (!/^#?\d+$/.test(orderNumber.trim())) return setError("Enter your order number, for example 12.");
    if (!normalizePakistaniMobile(phone)) return setError(PHONE_HINT);
    if (body.trim().length < REVIEW_LIMITS.minBody) return setError("Write a few words about the product.");

    const data = new FormData();
    data.set("productId", productId);
    data.set("orderNumber", orderNumber.trim());
    data.set("phone", phone);
    data.set("rating", String(rating));
    data.set("body", body.trim());
    data.set("name", name.trim());
    photos.forEach((p) => data.append("photos", p.file));

    setBusy(true);
    try {
      const res = await fetch("/api/reviews", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not send your review.");
      setDone(true);
    } catch (err: any) {
      setError(err.message === "Failed to fetch" ? "Could not reach the server. Check your connection." : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div ref={box} id="write-review" className="mt-4 scroll-mt-28 rounded-[16px] bg-leaf/10 px-5 py-4 text-[14px] text-onyx">
        <p className="font-bold">Thank you for your review!</p>
        <p className="mt-1 text-slate">It will appear here once we have checked it.</p>
      </div>
    );
  }

  return (
    <div ref={box} id="write-review" className="mt-4 scroll-mt-28">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[12px] border-2 border-onyx px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-onyx transition-colors hover:bg-onyx hover:text-white"
        >
          Write a review
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-[18px] border border-hair bg-[#fafafa] p-5 sm:p-6">
          <p className="text-[15px] font-bold text-onyx">Review {productTitle}</p>
          <p className="mt-1 text-[12px] text-slate">
            Only customers who ordered this product can review it. Your order number was shown when you ordered, and is in your confirmation email.
          </p>

          <div className="mt-5">
            <span className={label}>Your rating *</span>
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  className="p-0.5"
                >
                  <svg viewBox="0 0 20 20" className={`h-8 w-8 ${n <= (hover || rating) ? "fill-gold" : "fill-[#dedede]"}`}>
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="review-order" className={label}>Order number *</label>
              <input id="review-order" inputMode="numeric" placeholder="12" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="review-phone" className={label}>Phone you ordered with *</label>
              <input id="review-phone" type="tel" inputMode="tel" placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="review-body" className={label}>Your review *</label>
            <textarea
              id="review-body"
              rows={4}
              maxLength={REVIEW_LIMITS.body}
              placeholder="How is it working for you?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={input}
            />
            <p className="mt-1 text-right text-[11px] text-slate">{body.length}/{REVIEW_LIMITS.body}</p>
          </div>

          <div className="mt-2">
            <label htmlFor="review-name" className={label}>Name to show</label>
            <input id="review-name" maxLength={REVIEW_LIMITS.name} placeholder="Leave blank to show your first name and initial" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>

          <div className="mt-4">
            <span className={label}>Photos (up to {REVIEW_LIMITS.photos})</span>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.url} className="relative h-20 w-20 overflow-hidden rounded-[12px] bg-mist">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => removePhoto(p.url)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[14px] leading-none text-white">&times;</button>
                </div>
              ))}
              {photos.length < REVIEW_LIMITS.photos && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-[12px] border-2 border-dashed border-[#d0d0d0] text-[28px] text-slate hover:border-charcoal">
                  +
                  <input type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
                </label>
              )}
            </div>
          </div>

          {error && <p className="mt-4 rounded-[12px] border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">{error}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="btn-buy btn-buy-lg disabled:opacity-50">
              {busy ? "Sending..." : "Submit review"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-semibold text-slate hover:text-onyx">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
