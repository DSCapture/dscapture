import type { Metadata } from "next";

import ServiceSwiper from "./ServiceSwiperClient";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";
import type { ServiceSlideData } from "./types";

type ServiceSlideImageRecord = {
  id: string;
  file_path: string | null;
  public_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ServicePortfolioProjectRecord = {
  id: string;
  display_order: number | null;
  portfolio_projects: {
    id: string | null;
    title: string | null;
    slug: string | null;
  } | null;
};

type ServiceRecord = {
  id: string;
  slug: string;
  label: string | null;
  headline: string | null;
  subline: string | null;
  info_title: string | null;
  info_paragraphs: string[] | null;
  info_bullet_points: string[] | null;
  gradient_start: string | null;
  gradient_end: string | null;
  image_path: string | null;
  service_slide_images: ServiceSlideImageRecord | ServiceSlideImageRecord[] | null;
  service_portfolio_projects: ServicePortfolioProjectRecord[] | null;
};

const FALLBACK_GRADIENT_START = "#111827";
const FALLBACK_GRADIENT_END = "#1f2937";

const SERVICE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_BUCKET ?? "service-carousel";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const metadata: Metadata = {
  title: "Service | DS_Capture",
  description: "Unsere Services im Überblick.",
};

function normalizeImageRecords(
  images: ServiceRecord["service_slide_images"],
): ServiceSlideImageRecord[] {
  if (!images) {
    return [];
  }

  return Array.isArray(images) ? images : [images];
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function resolveImageUrl(record: ServiceRecord): { url: string | null; alt: string } {
  const images = normalizeImageRecords(record.service_slide_images);
  const sorted = images
    .slice()
    .sort((a, b) => {
      const aTime = parseTimestamp(a.updated_at ?? a.created_at);
      const bTime = parseTimestamp(b.updated_at ?? b.created_at);
      return bTime - aTime;
    });

  const primary = sorted[0];
  const candidatePath = primary?.file_path ?? record.image_path ?? null;
  const publicUrlCandidate = primary?.public_url ?? null;

  if (publicUrlCandidate && publicUrlCandidate.trim().length > 0) {
    return { url: publicUrlCandidate.trim(), alt: record.label?.trim() || record.slug };
  }

  if (!candidatePath) {
    return { url: null, alt: record.label?.trim() || record.slug };
  }

  if (/^https?:/i.test(candidatePath)) {
    return { url: candidatePath, alt: record.label?.trim() || record.slug };
  }

  if (!SUPABASE_URL) {
    return { url: null, alt: record.label?.trim() || record.slug };
  }

  const normalizedPath = candidatePath.replace(/^\/+/, "");

  return {
    url: `${SUPABASE_URL}/storage/v1/object/public/${SERVICE_BUCKET}/${normalizedPath}`,
    alt: record.label?.trim() || record.slug,
  };
}

function sanitizeStringArray(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

function mapServiceRecord(record: ServiceRecord): ServiceSlideData {
  const label = record.label?.trim() || "Service";
  const headline = record.headline?.trim() || label;
  const subline = record.subline?.trim() || "";
  const infoTitle = record.info_title?.trim() || null;
  const infoParagraphs = sanitizeStringArray(record.info_paragraphs);
  const infoBulletPoints = sanitizeStringArray(record.info_bullet_points);
  const gradientStart = record.gradient_start?.trim() || FALLBACK_GRADIENT_START;
  const gradientEnd = record.gradient_end?.trim() || FALLBACK_GRADIENT_END;

  const { url: imageUrl, alt: imageAlt } = resolveImageUrl(record);

  const sortedProjects = (record.service_portfolio_projects ?? [])
    .map((assignment) => {
      if (!assignment?.portfolio_projects) {
        return null;
      }

      const project = assignment.portfolio_projects;
      const title = project.title?.trim();

      if (!title) {
        return null;
      }

      return {
        id: project.id ?? assignment.id,
        title,
        slug: project.slug?.trim() ?? null,
        displayOrder: assignment.display_order ?? 0,
      };
    })
    .filter((value): value is { id: string; title: string; slug: string | null; displayOrder: number } => value !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const projects = sortedProjects.map(({ id, title, slug }) => ({ id, title, slug }));

  return {
    id: record.id,
    slug: record.slug,
    label,
    headline,
    subline,
    infoTitle,
    infoParagraphs,
    infoBulletPoints,
    gradientStart,
    gradientEnd,
    imageUrl,
    imageAlt,
    projects,
  } satisfies ServiceSlideData;
}

async function fetchServices(): Promise<ServiceSlideData[]> {
  const { data, error } = await supabase
    .from<ServiceRecord>("services")
    .select(
      `id, slug, label, headline, subline, info_title, info_paragraphs, info_bullet_points, gradient_start, gradient_end, image_path,
        service_slide_images (id, file_path, public_url, created_at, updated_at),
        service_portfolio_projects (id, display_order, portfolio_projects (id, title, slug))`,
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fehler beim Laden der Services:", error);
    return [];
  }

  return (data ?? []).map(mapServiceRecord);
}

export default async function ServicesPage() {
  const services = await fetchServices();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Unsere Services</h1>
        <p>
          Entdecke, wie wir deine Marke, Events und Produktionen visuell erlebbar machen.
          Wähle einen Service, um tiefer in unseren Prozess einzutauchen.
        </p>
      </section>

      {services.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Services folgen in Kürze</h2>
          <p>Aktuell sind noch keine Services veröffentlicht. Schaue bald wieder vorbei.</p>
        </div>
      ) : (
        <ServiceSwiper services={services} />
      )}
    </main>
  );
}
