import type { Metadata } from "next";
import HomePageClient from "@/components/home/HomePageClient";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "DS_Capture | Visuelle Exzellenz",
  description: "DS_Capture vereint Design, Strategie und Technologie zu einem klaren Markenauftritt.",
  openGraph: {
    title: "DS_Capture | Visuelle Exzellenz",
    description: "DS_Capture vereint Design, Strategie und Technologie zu einem klaren Markenauftritt.",
    url: "https://ds-capture.de/",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("home");
  return applyPageMetadata(defaultMetadata, record);
}

export default function HomePage() {
  return <HomePageClient />;
}
