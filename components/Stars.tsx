const STAR = "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z";

// Five stars filled exactly as far as `rating` goes, so an average of 4.7
// shows four full stars and most of a fifth rather than rounding up to five.
// Shared by testimonials and product reviews.
export default function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${Number(rating.toFixed(1))} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className={`relative inline-block shrink-0 ${size}`} aria-hidden="true">
            <svg viewBox="0 0 20 20" className={`absolute inset-0 ${size} fill-[#e3e3e3]`}>
              <path d={STAR} />
            </svg>
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.round(fill * 100)}%` }}>
                <svg viewBox="0 0 20 20" className={`${size} max-w-none fill-gold`}>
                  <path d={STAR} />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
