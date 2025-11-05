import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";

export type PageMetadataRow = {
  slug: string;
  title: string | null;
  description: string | null;
  open_graph_title: string | null;
  open_graph_description: string | null;
  open_graph_image_url: string | null;
  canonical_url: string | null;
  keywords: string | null;
};

export async function fetchPageMetadata(
  slug: string,
): Promise<PageMetadataRow | null> {
  const { data, error } = await supabase
    .from("page_metadata")
    .select(
      "slug, title, description, open_graph_title, open_graph_description, open_graph_image_url, canonical_url, keywords",
    )
    .eq("slug", slug)
    .maybeSingle<PageMetadataRow>();

  if (error) {
    console.error(`Fehler beim Laden der Metadaten für \"${slug}\":`, error.message);
    return null;
  }

  return data ?? null;
}

export function applyPageMetadata(
  defaults: Metadata,
  record: PageMetadataRow | null,
): Metadata {
  if (!record) {
    return defaults;
  }

  const normalizedKeywords = record.keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);

  const mergedMetadata: Metadata = {
    ...defaults,
    title: record.title?.trim() || defaults.title,
    description: record.description?.trim() || defaults.description,
  };

  if (normalizedKeywords && normalizedKeywords.length > 0) {
    mergedMetadata.keywords = normalizedKeywords;
  } else if (defaults.keywords) {
    mergedMetadata.keywords = defaults.keywords;
  }

  const canonicalUrl = record.canonical_url?.trim();
  if (canonicalUrl) {
    mergedMetadata.alternates = {
      ...defaults.alternates,
      canonical: canonicalUrl,
    };
  } else if (defaults.alternates) {
    mergedMetadata.alternates = defaults.alternates;
  }

  const baseOpenGraph = (defaults.openGraph ?? {}) as NonNullable<
    Metadata["openGraph"]
  >;
  const mergedOpenGraph: NonNullable<Metadata["openGraph"]> = {
    ...baseOpenGraph,
    url: canonicalUrl || baseOpenGraph.url,
  };

  const fallbackOpenGraphTitle =
    typeof mergedMetadata.title === "string" ? mergedMetadata.title : undefined;
  const resolvedOpenGraphTitle =
    record.open_graph_title?.trim() ||
    record.title?.trim() ||
    baseOpenGraph.title ||
    fallbackOpenGraphTitle;

  if (typeof resolvedOpenGraphTitle === "string") {
    mergedOpenGraph.title = resolvedOpenGraphTitle;
  }

  const fallbackOpenGraphDescription =
    typeof mergedMetadata.description === "string"
      ? mergedMetadata.description
      : undefined;
  const resolvedOpenGraphDescription =
    record.open_graph_description?.trim() ||
    record.description?.trim() ||
    baseOpenGraph.description ||
    fallbackOpenGraphDescription;

  if (typeof resolvedOpenGraphDescription === "string") {
    mergedOpenGraph.description = resolvedOpenGraphDescription;
  }

  if (record.open_graph_image_url?.trim()) {
    mergedOpenGraph.images = [{ url: record.open_graph_image_url.trim() }];
  } else if (baseOpenGraph.images) {
    mergedOpenGraph.images = baseOpenGraph.images;
  }

  if (Object.keys(mergedOpenGraph ?? {}).length > 0) {
    mergedMetadata.openGraph = mergedOpenGraph;
  }

  return mergedMetadata;
}
