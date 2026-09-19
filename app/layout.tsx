import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { getCategories } from "@/lib/categories-db";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ViewTracker from "@/components/ViewTracker";
import LivePresence from "@/components/LivePresence";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TechHulk — Pakistan's Fastest Growing Tech Store",
  description:
    "Earbuds, smartwatches, chargers and gadgets, delivered across Pakistan with Cash on Delivery.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Categories come from the admin; the ones marked "show in menu" drive the
  // header icons, the top links and the footer.
  const categories = await getCategories();
  const menu = categories
    .filter((category) => category.show_in_menu)
    .map(({ slug, name }) => ({ slug, name }));

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable}`}>
      <body className="font-body antialiased">
        <CartProvider>
          <TopBar menu={menu} />
          <Header categories={menu} />
          <main className="min-h-[60vh]">{children}</main>
          <Footer menu={menu} />
          <WhatsAppButton />
          <ViewTracker />
          <LivePresence />
        </CartProvider>
      </body>
    </html>
  );
}
