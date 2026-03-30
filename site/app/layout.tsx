import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import NavBar from "@/components/ui/NavBar";
import BackToTop from "@/components/ui/BackToTop";
import { property } from "@/config/property";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${property.name} — ${property.location.area} Vacation Rental`,
  description: property.description,
  openGraph: {
    title: property.name,
    description: property.tagline,
    images: [property.heroImage.src],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: property.name,
  description: property.description,
  image: property.heroImage.src,
  address: {
    "@type": "PostalAddress",
    streetAddress: "50184 Treasure Ct",
    addressLocality: "Frisco",
    addressRegion: "NC",
    postalCode: "27936",
    addressCountry: "US",
  },
  amenityFeature: property.highlights.map((h) => ({
    "@type": "LocationFeatureSpecification",
    name: h.label,
  })),
  numberOfRooms: property.bedrooms,
  petsAllowed: false,
  checkinTime: "16:00",
  checkoutTime: "10:00",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {!isAdmin && <NavBar />}
        {children}
        {!isAdmin && <BackToTop />}
      </body>
    </html>
  );
}
