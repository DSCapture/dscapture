import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";
import { applyPageMetadata, fetchPageMetadata } from "@/lib/pageMetadata";
import type { BlogCategory } from "@/lib/blogCategories";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published_at: string | null;
  category: BlogCategory | null;
};

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content, cover_image, published_at, category:blog_categories(id, name, slug)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Fehler beim Abrufen des Blog-Artikels:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    category: (data.category as BlogCategory | null) ?? null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  const pageSlug = `blog/${params.slug}`;
  const baseUrl = `https://ds-capture.de/${pageSlug}`;

  const defaultMetadata: Metadata = post
    ? {
        title: `${post.title} | DS_Capture`,
        description: post.excerpt ?? "Blogbeiträge von DS_Capture.",
        openGraph: {
          title: `${post.title} | DS_Capture`,
          description: post.excerpt ?? "Blogbeiträge von DS_Capture.",
          url: baseUrl,
          siteName: "DS_Capture",
          locale: "de_DE",
          type: "article",
          images: post.cover_image ? [{ url: post.cover_image }] : undefined,
        },
        alternates: {
          canonical: baseUrl,
        },
      }
    : {
        title: "Blog | DS_Capture",
        description: "Blogbeiträge von DS_Capture.",
        openGraph: {
          title: "Blog | DS_Capture",
          description: "Blogbeiträge von DS_Capture.",
          url: baseUrl,
          siteName: "DS_Capture",
          locale: "de_DE",
          type: "article",
        },
        alternates: {
          canonical: baseUrl,
        },
      };

  const record = await fetchPageMetadata(pageSlug);
  return applyPageMetadata(defaultMetadata, record);
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.content
    ? post.content.split(/\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <article className={styles.blogPost}>
      <header className={styles.blogPostHeader}>
        <div className={styles.metaRow}>
          {post.category && (
            <span className={styles.categoryBadge}>{post.category.name}</span>
          )}
          <p className={styles.blogPostMeta}>
            {post.published_at
              ? dateFormatter.format(new Date(post.published_at))
              : "Unveröffentlicht"}
          </p>
        </div>
        <h1 className={styles.blogPostTitle}>{post.title}</h1>
        {post.excerpt && <p className={styles.blogPostExcerpt}>{post.excerpt}</p>}
      </header>

      {post.cover_image && (
        <div
          className={styles.blogPostCover}
          style={{
            backgroundImage: `url(${post.cover_image})`,
          }}
          aria-hidden="true"
        />
      )}

      <div className={styles.blogPostContent}>
        {paragraphs.length > 0
          ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          : post.content && <p>{post.content}</p>}
      </div>
    </article>
  );
}
