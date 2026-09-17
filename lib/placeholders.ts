// ================================================================
// PLACEHOLDER CONTENT: replace everything in this file before launch.
//
// The photos are free Unsplash images (Unsplash License, commercial use
// allowed), hotlinked from images.unsplash.com. They stand in for TechHulk's
// own banner shoots and ambassadors so the store can already look like
// ronin.pk. Names are deliberately generic so nobody mistakes them for real
// endorsements. To swap a photo, paste a new image URL, and add its host to
// images.remotePatterns in next.config.js if it is not already listed.
// ================================================================

export function unsplash(id: string, width = 1600): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Hero slides. "all" links to the full catalog and shows the best discount. */
export const HERO_BANNERS = [
  {
    category: "watches",
    eyebrow: "Smart Wearables",
    word: "Watches",
    photo: unsplash("photo-1579586337278-3befd40fd17a", 2000),
  },
  {
    category: "earbuds",
    eyebrow: "True Wireless Audio",
    word: "Earbuds",
    photo: unsplash("photo-1611864583067-b002fdc4fa29", 2000),
  },
  {
    category: "chargers",
    eyebrow: "Fast Charging",
    word: "Chargers",
    photo: unsplash("photo-1557767382-97b28f5488e7", 2000),
  },
  {
    category: "all",
    eyebrow: "Top Deals",
    word: "Deals",
    photo: unsplash("photo-1519335553051-96f1218cd5fa", 2000),
  },
];

export const PROMO_PHOTOS = {
  earbuds: unsplash("photo-1572569511254-d8f925fe2cbb", 1400),
  chargers: unsplash("photo-1583863788434-e58a36330cf0", 1400),
};

export const AMBASSADORS = [
  { name: "Ambassador Name", role: "#Singer", photo: unsplash("photo-1605890822326-ab63270c7189", 700) },
  { name: "Ambassador Name", role: "#Actor", photo: unsplash("photo-1585236873828-5725311e7c06", 700) },
  { name: "Ambassador Name", role: "#Gamer", photo: unsplash("photo-1568593753067-bfe3d57b5bcb", 700) },
  { name: "Ambassador Name", role: "#Influencer", photo: unsplash("photo-1526413138270-8e3dedaecf19", 700) },
  { name: "Ambassador Name", role: "#Athlete", photo: unsplash("photo-1722513992912-360082625d33", 700) },
  { name: "Ambassador Name", role: "#Vlogger", photo: unsplash("photo-1625786682948-2168238883d2", 700) },
];

export const CREATORS = [
  { name: "Creator Name", role: "#Influencer", photo: unsplash("photo-1762288045707-dfd64fe6eb4b", 600) },
  { name: "Creator Name", role: "#Singer", photo: unsplash("photo-1699720212404-48638a108824", 600) },
  { name: "Creator Name", role: "#Gamer", photo: unsplash("photo-1699221559470-eb448d746947", 600) },
  { name: "Creator Name", role: "#Vlogger", photo: unsplash("photo-1677699298164-2e8489aee03d", 600) },
  { name: "Creator Name", role: "#DJ", photo: unsplash("photo-1759415491301-3cd2da948c17", 600) },
];

/** Real brands the catalog stocks (Apple, Google and OnePlus chargers). */
export const BRANDS = ["Apple", "Google", "OnePlus"];

export const SUPPORT = {
  phone: "03XX XXXXXXX",
  email: "support@techhulk.store",
};
