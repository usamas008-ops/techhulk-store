// Turns an order's or customer's captured ad-campaign data into a short,
// readable label like "Facebook Ads", "Google Ads" or "Direct".

export type Attribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
};

const PAID_MEDIUM = /^(cpc|ppc|paid|paid[-_ ]?social|ads?)$/i;

// utm_source aliases. Short forms are safe here because utm_source is a tag
// an advertiser chose on purpose, not a real domain name.
const SOURCE_ALIASES: Record<string, string> = {
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  google: "Google",
  youtube: "YouTube",
  yt: "YouTube",
  tiktok: "TikTok",
  tt: "TikTok",
  snapchat: "Snapchat",
  snap: "Snapchat",
  whatsapp: "WhatsApp",
  wa: "WhatsApp",
  bing: "Bing",
  pinterest: "Pinterest",
  twitter: "Twitter",
  x: "Twitter",
};

// Referrer hosts: only full platform names, matched as a whole domain label
// (so "m.facebook.com" still counts as Facebook). No short aliases here,
// since a real domain can end in a short country code by coincidence, such
// as ".tt" for Trinidad and Tobago.
const REFERRER_DOMAINS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  youtube: "YouTube",
  tiktok: "TikTok",
  snapchat: "Snapchat",
  whatsapp: "WhatsApp",
  bing: "Bing",
  pinterest: "Pinterest",
  twitter: "Twitter",
};

function titleCase(text: string): string {
  return text
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * "Facebook Ads" when an advertiser explicitly tagged the link (utm_source
 * plus a paid utm_medium, or an ad click id such as fbclid/gclid/ttclid,
 * captured in lib/attribution.ts). "google.com (organic)" for an ordinary
 * link from another site. "Direct" when nothing was captured at all.
 */
export function sourceLabel(a: Attribution): string {
  const source = (a.utm_source || "").trim().toLowerCase();
  const medium = (a.utm_medium || "").trim().toLowerCase();

  if (source) {
    const name = SOURCE_ALIASES[source] || titleCase(source);
    return PAID_MEDIUM.test(medium) ? `${name} Ads` : name;
  }

  const referrer = (a.referrer || "").trim().toLowerCase().replace(/^www\./, "");
  if (referrer) {
    const labels = referrer.split(".");
    const known = Object.keys(REFERRER_DOMAINS).find((key) => labels.includes(key));
    return known ? `${REFERRER_DOMAINS[known]} (organic)` : `${referrer} (organic)`;
  }

  return "Direct";
}
