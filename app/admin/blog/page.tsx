"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "../page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import blogStyles from "./page.module.css";
import "../adminComponents/adminPageHader.css";
import { supabase } from "@/lib/supabaseClient";

type BlogPostStatus = "draft" | "published" | "archived";

interface BlogPostPreview {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  status: BlogPostStatus;
}

export default function BlogManager() {
  const { loading } = useVerifyAdminAccess();
  const [publishedPosts, setPublishedPosts] = useState<BlogPostPreview[]>([]);
  const [draftPosts, setDraftPosts] = useState<BlogPostPreview[]>([]);
  const [fetchingPublished, setFetchingPublished] = useState(true);
  const [fetchingDrafts, setFetchingDrafts] = useState(true);
  const [publishedError, setPublishedError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    let isMounted = true;

    async function loadPosts() {
      setFetchingPublished(true);
      setFetchingDrafts(true);
      setPublishedError(null);
      setDraftError(null);

      const [publishedResult, draftsResult] = await Promise.all([
        supabase
          .from("posts")
          .select("id, title, slug, excerpt, cover_image, published_at, status")
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("posts")
          .select("id, title, slug, excerpt, cover_image, published_at, status")
          .eq("status", "draft")
          .order("id", { ascending: false }),
      ]);

      if (!isMounted) {
        return;
      }

      if (publishedResult.error) {
        console.error(
          "Fehler beim Laden der veröffentlichten Artikel:",
          publishedResult.error,
        );
        setPublishedError("Die veröffentlichten Artikel konnten nicht geladen werden.");
        setPublishedPosts([]);
      } else {
        setPublishedPosts(publishedResult.data ?? []);
      }

      if (draftsResult.error) {
        console.error(
          "Fehler beim Laden der Entwürfe:",
          draftsResult.error,
        );
        setDraftError("Die Entwürfe konnten nicht geladen werden.");
        setDraftPosts([]);
      } else {
        setDraftPosts(draftsResult.data ?? []);
      }

      setFetchingPublished(false);
      setFetchingDrafts(false);
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [loading]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    []
  );

  if (loading) {
    return (
      <div className={styles.adminPage}>
        <AdminSidebar />
        <div className={styles.adminContent}>Überprüfung läuft...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <AdminSidebar />
      <div className={`${styles.adminContent} ${blogStyles.blogContent}`}>
        <header className="adminPageHeader">
          <h1>Blog Manager</h1>
          <Link className={blogStyles.newBlogButton} href="/admin/blog/neuer-artikel">
            <i className="bi bi-plus-circle"></i> Neuer Artikel
          </Link>
        </header>

        <section className={blogStyles.blogSection}>
          <h2>Veröffentlichte Artikel</h2>

          {fetchingPublished && <p>Lade veröffentlichte Artikel...</p>}

          {!fetchingPublished && publishedError && (
            <p className={blogStyles.errorText}>{publishedError}</p>
          )}

          {!fetchingPublished && !publishedError && publishedPosts.length === 0 && (
            <p className={blogStyles.emptyState}>Es wurden noch keine Artikel veröffentlicht.</p>
          )}

          {!fetchingPublished && !publishedError && publishedPosts.length > 0 && (
            <div className={blogStyles.blogGrid}>
              {publishedPosts.map((post) => (
                <article key={post.id} className={blogStyles.blogCard}>
                  <Link href={`/admin/blog/${post.id}`} className={blogStyles.blogCardMain}>
                    <div
                      className={blogStyles.blogCardImage}
                      style={{
                        backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                      }}
                      aria-hidden={!post.cover_image}
                    />
                    <div className={blogStyles.blogCardBody}>
                      <h3 className={blogStyles.blogCardTitle}>{post.title}</h3>
                      {post.published_at && (
                        <p className={blogStyles.blogCardMeta}>
                          Veröffentlicht am {dateFormatter.format(new Date(post.published_at))}
                        </p>
                      )}
                      {post.excerpt && <p className={blogStyles.blogCardExcerpt}>{post.excerpt}</p>}
                    </div>
                  </Link>
                  <footer className={blogStyles.blogCardFooter}>
                    <Link className={blogStyles.blogCardAction} href={`/admin/blog/${post.id}`}>
                      Bearbeiten
                    </Link>
                    <Link
                      className={blogStyles.blogCardLink}
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Artikel ansehen
                    </Link>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={blogStyles.blogSection}>
          <h2>Entwürfe</h2>

          {fetchingDrafts && <p>Lade Entwürfe...</p>}

          {!fetchingDrafts && draftError && <p className={blogStyles.errorText}>{draftError}</p>}

          {!fetchingDrafts && !draftError && draftPosts.length === 0 && (
            <p className={blogStyles.emptyState}>Aktuell sind keine Entwürfe vorhanden.</p>
          )}

          {!fetchingDrafts && !draftError && draftPosts.length > 0 && (
            <div className={blogStyles.blogGrid}>
              {draftPosts.map((post) => (
                <article key={post.id} className={blogStyles.blogCard}>
                  <Link href={`/admin/blog/${post.id}`} className={blogStyles.blogCardMain}>
                    <div
                      className={blogStyles.blogCardImage}
                      style={{
                        backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                      }}
                      aria-hidden={!post.cover_image}
                    />
                    <div className={blogStyles.blogCardBody}>
                      <h3 className={blogStyles.blogCardTitle}>{post.title}</h3>
                      <p className={blogStyles.blogCardMeta}>Entwurf</p>
                      {post.excerpt && <p className={blogStyles.blogCardExcerpt}>{post.excerpt}</p>}
                    </div>
                  </Link>
                  <footer className={blogStyles.blogCardFooter}>
                    <Link className={blogStyles.blogCardAction} href={`/admin/blog/${post.id}`}>
                      Bearbeiten
                    </Link>
                    <Link
                      className={blogStyles.blogCardLink}
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vorschau öffnen
                    </Link>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
