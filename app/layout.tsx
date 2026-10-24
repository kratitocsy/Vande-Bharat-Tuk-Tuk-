import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_NAME, SITE_URL, PHONE_E164 } from "@/lib/config";

const TITLE = "Indo Tuk Tuk | Auto rickshaw & tuk tuk rides in Khajuraho";
const DESCRIPTION =
  "Book an auto rickshaw in Khajuraho. Call or WhatsApp a local rider for temple tours, airport and railway station transfers, and day trips to Raneh Falls and Panna. Agree the price by phone.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Khajuraho tuk tuk",
    "Khajuraho auto rickshaw",
    "Khajuraho taxi",
    "Khajuraho temple tour",
    "Khajuraho airport transfer",
    "Khajuraho railway station taxi",
    "Raneh Falls",
    "Panna National Park",
    "Khajuraho sightseeing",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f1",
};

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "TaxiService"],
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/images/khajuraho-hero.webp`,
  description: DESCRIPTION,
  telephone: PHONE_E164,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Khajuraho",
    addressRegion: "Madhya Pradesh",
    addressCountry: "IN",
  },
  areaServed: [
    { "@type": "City", name: "Khajuraho" },
    { "@type": "Place", name: "Raneh Falls" },
    { "@type": "Place", name: "Panna National Park" },
  ],
  paymentAccepted: "Cash, UPI",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: PHONE_E164,
    contactType: "reservations",
    availableLanguage: ["English", "Hindi"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
