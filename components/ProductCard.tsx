import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const onSale =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block overflow-hidden rounded-md border border-line bg-panel transition-colors hover:border-signal"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#0b120c]">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            No image
          </div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-sm bg-signal px-2 py-1 text-xs font-semibold text-ink">
            Sale
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-2 text-sm text-paper">{product.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base font-semibold text-signal">
            Rs. {product.price.toLocaleString()}
          </span>
          {onSale && (
            <span className="text-xs text-muted line-through">
              Rs. {product.compare_at_price!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
