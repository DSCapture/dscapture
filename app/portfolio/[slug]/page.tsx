import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";
import ProjectGallery from "@/components/portfolio/ProjectGallery/ProjectGallery";

type PortfolioProject = {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string | null;
  cover_public_url: string | null;
};

type PortfolioProjectImage = {
  id: string;
  caption: string | null;
  public_url: string;
  display_order: number;
};

type ProjectWithImages = {
  project: PortfolioProject | null;
  images: PortfolioProjectImage[];
};

const getProjectBySlug = cache(async (slug: string): Promise<ProjectWithImages> => {
  const { data: project, error: projectError } = await supabase
    .from("portfolio_projects")
    .select("id, title, subtitle, excerpt, slug, cover_public_url")
    .eq("slug", slug)
    .maybeSingle();

  if (projectError) {
    console.error("Fehler beim Laden des Portfolio-Projekts:", projectError);
  }

  if (!project) {
    return { project: null, images: [] };
  }

  const { data: images, error: imagesError } = await supabase
    .from("portfolio_project_images")
    .select("id, caption, public_url, display_order")
    .eq("project_id", project.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("Fehler beim Laden der Projektbilder:", imagesError);
  }

  return {
    project,
    images: (images ?? []).sort((a, b) => {
      if (a.display_order === b.display_order) {
        return a.caption?.localeCompare(b.caption ?? "") ?? 0;
      }

      return a.display_order - b.display_order;
    }),
  };
});

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("slug")
    .not("slug", "is", null);

  if (error) {
    console.error("Fehler beim Laden der Portfolio-Slugs:", error);
    return [];
  }

  return (data ?? [])
    .map((project) => project.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    .map((slug) => ({ slug }));
}

type GenerateMetadataProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { project } = await getProjectBySlug(params.slug);

  if (!project) {
    return {
      title: "Portfolio Projekt | DS_Capture",
    };
  }

  const canonicalUrl = `https://ds-capture.de/portfolio/${project.slug}`;
  const description =
    project.excerpt ??
    `Entdecke das Projekt "${project.title}" von DS_Capture mit ausgewählten Fotografien.`;

  return {
    title: `${project.title} | DS_Capture`,
    description,
    openGraph: {
      title: `${project.title} | DS_Capture`,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "DS_Capture",
      locale: "de_DE",
      images: project.cover_public_url
        ? [
            {
              url: project.cover_public_url,
              alt: project.title,
            },
          ]
        : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

type ProjectPageProps = {
  params: { slug: string };
};

export default async function PortfolioProjectPage({ params }: ProjectPageProps) {
  const { project, images } = await getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const heroImage = project.cover_public_url ?? null;

  return (
    <div className={styles.projectPage}>
      <div className={styles.heroSection}>
        <div className={styles.heroText}>
          <Link href="/portfolio" className={styles.backLink}>
            &larr; Zurück zur Übersicht
          </Link>
          <h1 className={styles.projectTitle}>{project.title}</h1>
          {project.subtitle ? <p className={styles.projectSubtitle}>{project.subtitle}</p> : null}
          {project.excerpt ? <p className={styles.projectExcerpt}>{project.excerpt}</p> : null}
        </div>
        {heroImage ? (
          <div className={styles.heroImageWrapper}>
            <Image
              src={heroImage}
              alt={project.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className={styles.heroImage}
            />
          </div>
        ) : null}
      </div>

      <section className={styles.gallerySection}>
        <h2 className={styles.galleryHeading}>Bildgalerie</h2>
        {images.length > 0 ? (
          <ProjectGallery images={images} projectTitle={project.title} />
        ) : (
          <p className={styles.emptyState}>Für dieses Projekt wurden noch keine Bilder veröffentlicht.</p>
        )}
      </section>
    </div>
  );
}
