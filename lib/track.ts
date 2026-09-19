// Browser-side analytics. Sends tiny anonymous events to /api/track.
// Nothing personal is collected: a visitor is a random id in localStorage.

type TrackEvent = "page_view" | "add_to_cart";

const VISITOR_KEY = "th_visitor";
const REFERRER_KEY = "th_referrer_sent";
let last = { key: "", at: 0 };

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-visitor";
  }
}

export function getDevice(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

// The outside site a visitor came from, sent once per browser session.
function externalReferrer(): string | null {
  try {
    if (sessionStorage.getItem(REFERRER_KEY)) return null;
    sessionStorage.setItem(REFERRER_KEY, "1");
    if (!document.referrer) return null;
    const host = new URL(document.referrer).host;
    return host && host !== window.location.host ? host.slice(0, 200) : null;
  } catch {
    return null;
  }
}

export function track(event: TrackEvent, options: { path?: string; productId?: string } = {}) {
  if (typeof window === "undefined") return;
  const path = options.path ?? window.location.pathname;

  // React runs effects twice in development; ignore an identical event
  // fired again within a second.
  const key = `${event}:${path}:${options.productId ?? ""}`;
  const now = Date.now();
  if (last.key === key && now - last.at < 1000) return;
  last = { key, at: now };

  const body = JSON.stringify({
    event,
    path,
    productId: options.productId ?? null,
    visitorId: getVisitorId(),
    device: getDevice(),
    referrer: externalReferrer(),
  });

  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break the store.
  }
}
