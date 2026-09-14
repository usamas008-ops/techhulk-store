import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const compareAt = product.compare_at_price;
  const onSale = Boolean(compareAt && compareAt > product.price);
  const off = onSale
    ? Math.round((1 - product.price / (compareAt as number)) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col border border-hair bg-card transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)]"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-slate">
            No image
          </div>
        )}

        {onSale && off > 0 && (
          <span className="absolute left-0 top-3 bg-sale px-2 py-1 text-[11px] font-bold leading-none text-white">
            -{off}%
          </span>
        )}

        {product.stock <= 0 && (
          <span className="absolute right-0 top-3 bg-night px-2 py-1 text-[11px] font-bold leading-none text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-hair p-3.5">
        {product.category && (
          <p className="eyebrow text-slate">{categoryLabel(product.category)}</p>
        )}

        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-night">
          {product.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className="text-[15px] font-bold text-night">
            Rs.{product.price.toLocaleString()}
          </span>
          {onSale && (
            <span className="text-[12px] text-slate line-through">
              Rs.{(compareAt as number).toLocaleString()}
            </span>
          )}
        </div>

        <span className="mt-1.5 block rounded-full bg-night py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-leaf">
          Buy now
        </span>
      </div>
    </Link>
  );
}
