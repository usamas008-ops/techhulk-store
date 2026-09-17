import Link from "next/link";

const links = [
  { href: "/collections/all", label: "Cash on Delivery", tone: "font-extrabold text-[#B8872F]" },
  { href: "/collections/all", label: "Free Delivery Nationwide", tone: "font-extrabold text-[#15803D]" },
  { href: "/collections/watches", label: "Smart Watches" },
  { href: "/collections/earbuds", label: "Wireless Earbuds" },
  { href: "/collections/chargers", label: "Fast Chargers" },
  { href: "/collections/all", label: "Shop All" },
  { href: "/cart", label: "Your Cart" },
];

export default function TopBar() {
  return (
    <div className="hidden md:block">
      <div className="container-page flex h-11 items-center justify-center gap-7 text-[12px] font-medium text-steel">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`whitespace-nowrap transition-colors hover:text-charcoal ${link.tone ?? ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
