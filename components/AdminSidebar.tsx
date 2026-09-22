"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/live", label: "Live now" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-panel p-4">
      <p className="mb-6 font-display text-lg font-semibold text-paper">
        Tech<span className="text-signal">Hulk</span> Admin
      </p>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-sm px-3 py-2 text-sm ${
              pathname === link.href
                ? "bg-signal text-ink font-medium"
                : "text-paper/80 hover:bg-ink"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleSignOut}
        className="mt-8 w-full rounded-sm border border-line px-3 py-2 text-left text-sm text-muted hover:border-danger hover:text-danger"
      >
        Sign out
      </button>
    </aside>
  );
}
