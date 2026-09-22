// Remembers which ad or link brought a visitor, so it can be attached to
// their order at checkout. Nothing personal: just campaign tags read from
// the URL, kept in this browser's localStorage for up to 30 days.

const KEY = "th_attribution";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type StoredAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  capturedAt: number;
};

// Click ids each ad platform appends to its links, used even when the
// advertiser did not also add utm_source/utm_medium.
const CLICK_IDS: Record<string, { source: string; medium: string }> = {
  fbclid: { source: "facebook", medium: "cpc" },
  gclid: { source: "google", medium: "cpc" },
  ttclid: { source: "tiktok", medium: "cpc" },
  msclkid: { source: "bing", medium: "cpc" },
};

function readStored(): StoredAttribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed.capturedAt || Date.now() - parsed.capturedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(a: StoredAttribution): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // Private browsing or storage disabled: attribution is simply not saved.
  }
}

function externalReferrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).host;
    return host && host !== window.location.host ? host.slice(0, 200) : null;
  } catch {
    return null;
  }
}

/**
 * Reads utm_* parameters and ad click ids from the current page's URL. When
 * present, they replace whatever was stored before: the most recent ad click
 * before an order gets the credit. With no such signal, an attribution
 * captured earlier survives ordinary browsing inside the store; a first-ever
 * visit that arrived from another site is stored once, as an organic
 * referral, so it is not lost either. Call this on every storefront page.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    let clickSource: string | null = null;
    let clickMedium: string | null = null;
    for (const [param, guess] of Object.entries(CLICK_IDS)) {
      if (params.has(param)) {
        clickSource = guess.source;
        clickMedium = guess.medium;
        break;
      }
    }

    if (utmSource || utmMedium || utmCampaign || clickSource) {
      write({
        utm_source: (utmSource || clickSource || "").slice(0, 60) || null,
        utm_medium: (utmMedium || clickMedium || "").slice(0, 60) || null,
        utm_campaign: (utmCampaign || "").slice(0, 100) || null,
        referrer: externalReferrerHost(),
        landing_path: window.location.pathname.slice(0, 300),
        capturedAt: Date.now(),
      });
      return;
    }

    if (!readStored()) {
      const referrer = externalReferrerHost();
      if (referrer) {
        write({
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          referrer,
          landing_path: window.location.pathname.slice(0, 300),
          capturedAt: Date.now(),
        });
      }
    }
  } catch {
    // Attribution must never break the store.
  }
}

export function getAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  return readStored();
}
