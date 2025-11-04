import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";

const defaultMetadata: Metadata = {
  title: "Blog | DS_Capture",
  description: "Aktuelle Beiträge und Neuigkeiten von DS_Capture.",
  openGraph: {
    title: "Blog | DS_Capture",
    description: "Aktuelle Beiträge und Neuigkeiten von DS_Capture.",
    url: "https://ds-capture.de/blog",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
  alternates: {
    canonical: "https://ds-capture.de/blog",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const record = await fetchPageMetadata("blog");
  return applyPageMetadata(defaultMetadata, record);
}

export const revalidate = 120;

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
};

async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_image, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Fehler beim Abrufen der Blog-Artikel:", error);
    return [];
  }

  return data ?? [];
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className={styles.blogContent}>
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p className={styles.emptyState}>Derzeit sind keine Blog-Beiträge veröffentlicht.</p>
      ) : (
        <div className={styles.blogGrid}>
          {posts.map((post) => (
            <article key={post.id} className={styles.blogCard}>
              <div
                className={styles.blogCardImage}
                style={{
                  backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                }}
                aria-hidden={!post.cover_image}
              />
              <div className={styles.blogCardBody}>
                <h2 className={styles.blogCardTitle}>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                {post.published_at && (
                  <p className={styles.blogCardMeta}>
                    {dateFormatter.format(new Date(post.published_at))}
                  </p>
                )}
                {post.excerpt && <p className={styles.blogCardExcerpt}>{post.excerpt}</p>}
              </div>
              <footer className={styles.blogCardFooter}>
                <Link className={styles.readMoreLink} href={`/blog/${post.slug}`}>
                  Weiterlesen
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
