import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { discountPercent } from "@/lib/product-meta";
import type { Product } from "@/lib/types";

// Ronin-style card: vertical category ribbon on the left edge, image tile,
// uppercase title, one short note, then price and a blue "Buy Now" button.
export default function ProductCard({
  product,
  note,
}: {
  product: Product;
  note?: string;
}) {
  const off = discountPercent(product);
  const compareAt = product.compare_at_price;
  const ribbon = product.category ? categoryLabel(product.category) : "TechHulk";

  return (
    <Link href={`/products/${product.handle}`} className="group relative block pl-[18px]">
      <span className="badge-vertical">{ribbon}</span>

      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-white">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 300px"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-charcoal/60">
            No image
          </div>
        )}

        {off > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-sale px-2 py-1 text-[10px] font-bold leading-none text-white">
            -{off}%
          </span>
        )}

        {product.stock <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="pt-3.5">
        <p className="line-clamp-2 min-h-[40px] text-[13px] font-bold uppercase leading-[1.45] text-charcoal sm:text-[14px]">
          {product.title}
        </p>
        {note && (
          <p className="mt-1.5 line-clamp-1 text-[9.5px] font-bold text-charcoal/80 sm:text-[10px]">
            {note}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="leading-tight">
            <p className="text-[14px] font-black text-charcoal sm:text-[15.6px]">
              Rs.{product.price.toLocaleString()}
            </p>
            {off > 0 && compareAt && (
              <p className="text-[11.5px] font-semibold text-charcoal/65 line-through sm:text-[12.5px]">
                Rs.{compareAt.toLocaleString()}
              </p>
            )}
          </div>
          <span className="btn-buy shrink-0">Buy Now</span>
        </div>
      </div>
    </Link>
  );
}
