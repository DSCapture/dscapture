import type { Metadata } from "next";
import ServicesView, {
  type ServiceDefinition,
  type ServicePortfolioProject,
} from "./ServicesView";
import { supabase } from "@/lib/supabaseClient";

export const metadata: Metadata = {
  title: "Services | DS_Capture",
  description: "Überblick über die Services von DS_Capture.",
};

export const revalidate = 120;

type ServiceRecord = {
  id: string;
  slug: string;
  label: string;
  headline: string;
  subline: string;
  info_paragraphs: string[] | null;
  info_title: string | null;
  info_bullet_points: string[] | null;
  gradient_start: string | null;
  gradient_end: string | null;
  image_path: string | null;
  service_portfolio_projects: {
    id: string;
    project_id: string;
    display_order: number;
    project: {
      id: string;
      title: string;
      subtitle: string | null;
      slug: string | null;
      cover_public_url: string | null;
    } | null;
  }[] | null;
};

async function fetchServices(): Promise<ServiceDefinition[]> {
  const { data, error } = await supabase
    .from<ServiceRecord>("services")
    .select(
      `id, slug, label, headline, subline, info_title, info_paragraphs, info_bullet_points, gradient_start, gradient_end, image_path,
        service_portfolio_projects (
          id,
          project_id,
          display_order,
          project:portfolio_projects (
            id,
            title,
            subtitle,
            slug,
            cover_public_url
          )
        )`,
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fehler beim Abrufen der Services:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucketName =
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_BUCKET ?? "service-carousel";

  return data.map((service) => {
    const imagePath = service.image_path ?? "";
    const normalizedPath = imagePath.replace(/^\/+/, "");
    const imageUrl = imagePath.startsWith("http")
      ? imagePath
      : supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/${bucketName}/${normalizedPath}`
        : normalizedPath;

    return {
      id: service.slug,
      label: service.label,
      headline: service.headline,
      subline: service.subline,
      paragraphs: service.info_paragraphs ?? [],
      infoTitle: service.info_title ?? "",
      bulletPoints: service.info_bullet_points ?? [],
      gradientStart: service.gradient_start ?? "#111827",
      gradientEnd: service.gradient_end ?? "#1f2937",
      portfolioProjects: (service.service_portfolio_projects ?? [])
        .sort((a, b) => a.display_order - b.display_order)
        .map((item) => {
          const project = item.project;
          if (!project) {
            return null;
          }

          return {
            id: project.id,
            title: project.title,
            subtitle: project.subtitle ?? null,
            slug: project.slug ?? null,
            coverUrl: project.cover_public_url ?? null,
          } satisfies ServicePortfolioProject;
        })
        .filter((project): project is ServicePortfolioProject => project !== null),
      imageUrl,
    } satisfies ServiceDefinition;
  });
}

export default async function ServicesPage() {
  const services = await fetchServices();

  return <ServicesView services={services} />;
}
