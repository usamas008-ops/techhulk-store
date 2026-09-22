import Link from "next/link";
import { collectionHref } from "@/lib/categories";

type MenuCategory = { slug: string; name: string };

export default function TopBar({
  menu,
  deliveryLabel = "Free Delivery Nationwide",
}: {
  menu: MenuCategory[];
  deliveryLabel?: string;
}) {
  const links = [
    { href: collectionHref("all"), label: "Cash on Delivery", tone: "font-extrabold text-[#B8872F]" },
    { href: collectionHref("all"), label: deliveryLabel, tone: "font-extrabold text-[#15803D]" },
    ...menu.map((category) => ({ href: collectionHref(category.slug), label: category.name, tone: "" })),
    { href: collectionHref("all"), label: "Shop All", tone: "" },
    { href: "/cart", label: "Your Cart", tone: "" },
  ];

  return (
    <div className="hidden md:block">
      <div className="container-page flex h-11 items-center justify-center gap-7 text-[12px] font-medium text-steel">
        {links.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={`whitespace-nowrap transition-colors hover:text-charcoal ${link.tone}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
