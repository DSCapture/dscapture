import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";
import { supabase } from "@/lib/supabaseClient";

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

type PortfolioSettings = {
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_description: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  background_public_url: string | null;
};

type PortfolioProject = {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string | null;
  cover_public_url: string | null;
  display_order: number;
  is_featured: boolean;
};

async function getPortfolioData() {
  const [{ data: settingsData, error: settingsError }, { data: projectsData, error: projectsError }] =
    await Promise.all([
      supabase
        .from("portfolio_settings")
        .select(
          "hero_headline, hero_subheadline, hero_description, hero_cta_label, hero_cta_url, background_public_url",
        )
        .order("updated_at", { ascending: false })
        .limit(1),
      supabase
        .from("portfolio_projects")
        .select(
          "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
        )
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (settingsError) {
    console.error("Fehler beim Laden der Portfolio-Einstellungen:", settingsError);
  }

  if (projectsError) {
    console.error("Fehler beim Laden der Portfolio-Projekte:", projectsError);
  }

  const settings: PortfolioSettings | null = settingsData?.[0] ?? null;
  const projects: PortfolioProject[] = (projectsData ?? []).sort((a, b) => {
    if (a.display_order === b.display_order) {
      return a.title.localeCompare(b.title);
    }

    return a.display_order - b.display_order;
  });

  return { settings, projects };
}

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("portfolio");
  return applyPageMetadata(defaultMetadata, record);
}

export default async function PortfolioPage() {
  const { settings, projects } = await getPortfolioData();

  const heroHeadline = settings?.hero_headline ?? "Saint Antönien";
  const heroSubheadline = settings?.hero_subheadline ?? "Switzerland Alps";
  const heroDescription =
    settings?.hero_description ??
    "Entdecke einzigartige Reportagen, Landschaften und Outdoor-Produktionen aus den Alpen und der ganzen Welt.";
  const heroCtaLabel = settings?.hero_cta_label ?? "Projekt anfragen";
  const heroCtaUrl = settings?.hero_cta_url ?? "/kontakt";

  return (
    <div className={styles.portfolioPage}>
      <div className={styles.background}>
        {settings?.background_public_url ? (
          <Image
            src={settings.background_public_url}
            alt="Portfolio Hintergrund"
            fill
            priority
            sizes="100vw"
            className={styles.backgroundImage}
          />
        ) : (
          <div className={styles.backgroundFallback} aria-hidden />
        )}
        <div className={styles.backgroundOverlay} aria-hidden />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.heroContent}>
          <span className={styles.heroSubtitle}>{heroSubheadline}</span>
          <h1 className={styles.heroTitle}>{heroHeadline}</h1>
          <p className={styles.heroDescription}>{heroDescription}</p>
          {heroCtaLabel && heroCtaUrl && (
            <a className={styles.heroCta} href={heroCtaUrl}>
              {heroCtaLabel}
            </a>
          )}
        </div>

        <div className={styles.projectColumn}>
          <div className={styles.projectColumnHeader}>
            <h2>Portfolio</h2>
            <span className={styles.projectCount}>
              {projects.length.toString().padStart(2, "0")}
            </span>
          </div>

          {projects.length === 0 ? (
            <p className={styles.emptyState}>
              Weitere Projekte folgen in Kürze. Schaue gerne später noch einmal
              vorbei.
            </p>
          ) : (
            <div className={styles.projectsGrid}>
              {projects.map((project) => {
                const slug = project.slug?.trim() ?? "";
                const hasSlug = slug.length > 0;

                const cardContent = (
                  <article className={styles.projectCard}>
                    <div className={styles.projectCoverWrapper}>
                      {project.cover_public_url ? (
                        <Image
                          src={project.cover_public_url}
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 80vw, 360px"
                          className={styles.projectCover}
                        />
                      ) : (
                        <div className={styles.projectCoverPlaceholder}>
                          <span>{project.title}</span>
                        </div>
                      )}

                      <div className={styles.projectOverlay}>
                        <div className={styles.projectTexts}>
                          <h3 className={styles.projectTitle}>{project.title}</h3>
                          {project.subtitle && (
                            <p className={styles.projectSubtitle}>{project.subtitle}</p>
                          )}
                        </div>

                        {hasSlug ? (
                          <span className={styles.projectLink}>Ansehen</span>
                        ) : null}
                      </div>
                    </div>

                    {project.is_featured && (
                      <span className={styles.featuredBadge}>Highlight</span>
                    )}
                  </article>
                );

                if (hasSlug) {
                  return (
                    <Link
                      href={{
                        pathname: "/portfolio/[slug]",
                        params: { slug },
                      }}
                      key={project.id}
                      className={styles.projectCardLink}
                      aria-label={`${project.title} ansehen`}
                      title={project.title}
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div key={project.id} className={styles.projectCardWrapper}>
                    {cardContent}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
