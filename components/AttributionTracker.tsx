"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

// Reads ad-campaign parameters (utm_*, fbclid, gclid, ttclid, ...) from the URL on
// every storefront page and remembers them for the order this visitor places.
export default function AttributionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    captureAttribution();
  }, [pathname]);

  return null;
}
