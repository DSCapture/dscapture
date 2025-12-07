import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";
import { normalizeBlogCategory, type BlogCategory } from "@/lib/blogCategories";

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
  spotlight: boolean;
  category: BlogCategory | null;
};

type BlogBackground = {
  public_url: string | null;
};

async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, cover_image, published_at, spotlight, category:blog_categories(id, name, slug)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Fehler beim Abrufen der Blog-Artikel:", error);
    return [];
  }

  return (data ?? []).map((post) => ({
    ...post,
    spotlight: Boolean(post.spotlight),
    category: normalizeBlogCategory(post?.category),
  }));
}

async function getBlogBackground(): Promise<string | null> {
  const { data, error } = await supabase
    .from("blog_backgrounds")
    .select("public_url")
    .eq("singleton_key", "blog")
    .maybeSingle<BlogBackground>();

  if (error) {
    console.error("Fehler beim Laden des Blog-Hintergrunds:", error);
    return null;
  }

  return data?.public_url ?? null;
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function BlogPage() {
  const [posts, backgroundUrl] = await Promise.all([
    getPublishedPosts(),
    getBlogBackground(),
  ]);
  const spotlightPost = posts.find((post) => post.spotlight);
  const otherPosts = spotlightPost
    ? posts.filter((post) => post.id !== spotlightPost.id)
    : posts;

  const pageBackgroundStyle = backgroundUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(12, 18, 33, 0.72), rgba(12, 18, 33, 0.9)), url(${backgroundUrl})`,
      }
    : undefined;

  return (
    <div className={styles.pageBackground} style={pageBackgroundStyle}>
      <div className={styles.pageBackdrop}>
        <div className={styles.blogContent}>
          <h1>Blog</h1>
          {posts.length === 0 ? (
            <p className={styles.emptyState}>Derzeit sind keine Blog-Beiträge veröffentlicht.</p>
          ) : (
            <>
              {spotlightPost && (
                <Link href={`/blog/${spotlightPost.slug}`} className={styles.spotlightCardLink}>
                  <article className={styles.spotlightCard}>
                    <div
                      className={styles.spotlightImage}
                      style={{
                        backgroundImage: spotlightPost.cover_image
                          ? `url(${spotlightPost.cover_image})`
                          : undefined,
                      }}
                      aria-hidden={!spotlightPost.cover_image}
                    />
                    <div className={styles.spotlightBody}>
                      <span className={styles.spotlightBadge}>Spotlight</span>
                      <h2 className={styles.spotlightTitle}>{spotlightPost.title}</h2>
                      {(spotlightPost.category || spotlightPost.published_at) && (
                        <div className={styles.metaRow}>
                          {spotlightPost.category && (
                            <span className={styles.categoryBadge}>{spotlightPost.category.name}</span>
                          )}
                          {spotlightPost.published_at && (
                            <p className={styles.spotlightMeta}>
                              {dateFormatter.format(new Date(spotlightPost.published_at))}
                            </p>
                          )}
                        </div>
                      )}
                      {spotlightPost.excerpt && (
                        <p className={styles.spotlightExcerpt}>{spotlightPost.excerpt}</p>
                      )}
                      <span className={styles.spotlightReadMore} aria-hidden>
                        Weiterlesen
                      </span>
                    </div>
                  </article>
                </Link>
              )}
              {otherPosts.length > 0 && (
                <div className={styles.blogGrid}>
                  {otherPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogCardLink}>
                      <article className={styles.blogCard}>
                        <div
                          className={styles.blogCardImage}
                          style={{
                            backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                          }}
                          aria-hidden={!post.cover_image}
                        />
                        <div className={styles.blogCardBody}>
                          <h2 className={styles.blogCardTitle}>{post.title}</h2>
                          {(post.category || post.published_at) && (
                            <div className={styles.metaRow}>
                              {post.category && (
                                <span className={styles.categoryBadge}>{post.category.name}</span>
                              )}
                              {post.published_at && (
                                <p className={styles.blogCardMeta}>
                                  {dateFormatter.format(new Date(post.published_at))}
                                </p>
                              )}
                            </div>
                          )}
                          {post.excerpt && <p className={styles.blogCardExcerpt}>{post.excerpt}</p>}
                        </div>
                        <footer className={styles.blogCardFooter}>
                          <span className={styles.readMoreLink} aria-hidden>
                            Weiterlesen
                          </span>
                        </footer>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
