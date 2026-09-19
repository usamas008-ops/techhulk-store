const HAS_HTML = /<\/?[a-z][\s\S]*?>/i;
// ![alt text](https://link) inserts a picture, the same syntax as Markdown.
const IMAGE = /!\[([^\]]*)\]\((https:\/\/[^)\s"]+)\)/g;
const IMAGE_ONLY = /^!\[([^\]]*)\]\((https:\/\/[^)\s"]+)\)$/;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (text: string) => escapeHtml(text).replace(/"/g, "&quot;");

const img = (alt: string, src: string) => `<img src="${src}" alt="${alt}" loading="lazy" />`;

/**
 * Product descriptions can be HTML (imported from Shopify) or plain text typed
 * in the admin. Plain text becomes paragraphs: a blank line starts a new one
 * and a single line break stays a line break. Pictures written as
 * ![alt](https://...) work in both.
 */
export function descriptionHtml(raw: string | null | undefined): string {
  const text = (raw || "").trim();
  if (!text) return "";

  if (HAS_HTML.test(text)) {
    return text.replace(IMAGE, (_m, alt: string, src: string) => img(escapeAttr(alt), escapeAttr(src)));
  }

  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const paragraph = block.trim();
      const only = paragraph.match(IMAGE_ONLY);
      if (only) return img(escapeAttr(only[1]), escapeAttr(only[2]));
      // Text is escaped first, so &, < and > inside links are already safe.
      const safe = escapeHtml(paragraph).replace(/\n/g, "<br />");
      return `<p>${safe.replace(IMAGE, (_m, alt: string, src: string) => img(alt.replace(/"/g, "&quot;"), src))}</p>`;
    })
    .join("");
}
