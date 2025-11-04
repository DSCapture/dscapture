import type { Metadata } from "next";
import styles from "./page.module.css";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "Portfolio | DS_Capture",
  description: "Projekte und Arbeiten von DS_Capture im Überblick.",
  openGraph: {
    title: "Portfolio | DS_Capture",
    description: "Projekte und Arbeiten von DS_Capture im Überblick.",
    url: "https://ds-capture.de/portfolio",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/portfolio",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("portfolio");
  return applyPageMetadata(defaultMetadata, record);
}

export default function PortfolioPage() {
  return (
    <div className={styles.blogContent}>
      <h1>Portfolio</h1>
    </div>
  );
}