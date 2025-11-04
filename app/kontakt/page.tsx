import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "Kontakt | DS_Capture",
  description: "Kontaktiere DS_Capture für Projekte rund um Design, Strategie und Technologie.",
  openGraph: {
    title: "Kontakt | DS_Capture",
    description: "Kontaktiere DS_Capture für Projekte rund um Design, Strategie und Technologie.",
    url: "https://ds-capture.de/kontakt",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/kontakt",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("kontakt");
  return applyPageMetadata(defaultMetadata, record);
}

export default function ContactPage() {
  return <ContactPageClient />;
}
