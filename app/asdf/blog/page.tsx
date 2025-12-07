"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import blogStyles from "./page.module.css";
import "../adminComponents/adminPageHader.css";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import type { BlogCategory } from "@/lib/blogCategories";
import { useToast } from "@/components/toast/ToastProvider";

function isBlogCategory(value: unknown): value is BlogCategory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BlogCategory>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string"
  );
}

function normalizeCategory(category: unknown): BlogCategory | null {
  if (!category) {
    return null;
  }

  if (Array.isArray(category)) {
    return category.find(isBlogCategory) ?? null;
  }

  return isBlogCategory(category) ? category : null;
}

type BlogPostStatus = "draft" | "published" | "archived";

type BlogBackground = {
  id: string;
  file_path: string;
  public_url: string;
};

interface BlogPostPreview {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  status: BlogPostStatus;
  spotlight: boolean;
  category: BlogCategory | null;
}

export default function BlogManager() {
  const { loading } = useVerifyAdminAccess();
  const { showToast } = useToast();
  const [publishedPosts, setPublishedPosts] = useState<BlogPostPreview[]>([]);
  const [draftPosts, setDraftPosts] = useState<BlogPostPreview[]>([]);
  const [fetchingPublished, setFetchingPublished] = useState(true);
  const [fetchingDrafts, setFetchingDrafts] = useState(true);
  const [publishedError, setPublishedError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [updatingSpotlightId, setUpdatingSpotlightId] = useState<number | null>(
    null,
  );
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [background, setBackground] = useState<BlogBackground | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState(false);

  const backgroundBucket = "blog-background";

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
      setCategoriesLoading(true);
      setCategoriesError(null);

      const [categoriesResult, publishedResult, draftsResult, backgroundResult] =
        await Promise.all([
          supabase
            .from("blog_categories")
            .select("id, name, slug")
            .order("name", { ascending: true }),
          supabase
          .from("posts")
          .select(
            "id, title, slug, excerpt, cover_image, published_at, status, spotlight, category:blog_categories(id, name, slug)",
          )
          .eq("status", "published")
          .order("published_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("posts")
          .select(
            "id, title, slug, excerpt, cover_image, published_at, status, spotlight, category:blog_categories(id, name, slug)",
          )
          .eq("status", "draft")
          .order("id", { ascending: false }),
          supabase
            .from("blog_backgrounds")
            .select("id, file_path, public_url")
            .eq("singleton_key", "blog")
            .maybeSingle(),
        ]);

      if (!isMounted) {
        return;
      }

      if (categoriesResult.error) {
        console.error(
          "Fehler beim Laden der Kategorien:",
          categoriesResult.error,
        );
        setCategoriesError("Die Kategorien konnten nicht geladen werden.");
        setCategories([]);
      } else {
        setCategories(categoriesResult.data ?? []);
      }

      setCategoriesLoading(false);

      if (publishedResult.error) {
        console.error(
          "Fehler beim Laden der veröffentlichten Artikel:",
          publishedResult.error,
        );
        setPublishedError("Die veröffentlichten Artikel konnten nicht geladen werden.");
        setPublishedPosts([]);
      } else {
        setPublishedPosts(
          (publishedResult.data ?? []).map((post) => ({
            ...post,
            spotlight: Boolean(post.spotlight),
            category: normalizeCategory(post.category),
          })),
        );
      }

      if (draftsResult.error) {
        console.error(
          "Fehler beim Laden der Entwürfe:",
          draftsResult.error,
        );
        setDraftError("Die Entwürfe konnten nicht geladen werden.");
        setDraftPosts([]);
      } else {
        setDraftPosts(
          (draftsResult.data ?? []).map((post) => ({
            ...post,
            spotlight: Boolean(post.spotlight),
            category: normalizeCategory(post.category),
          })),
        );
      }

      if (backgroundResult.error) {
        console.error(
          "Fehler beim Laden des Blog-Hintergrunds:",
          backgroundResult.error,
        );
        setBackground(null);
      } else {
        setBackground(backgroundResult.data ?? null);
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

  const filteredPublishedPosts = useMemo(() => {
    if (!selectedCategoryId) {
      return publishedPosts;
    }

    return publishedPosts.filter(
      (post) => post.category?.id === selectedCategoryId,
    );
  }, [publishedPosts, selectedCategoryId]);

  const filteredDraftPosts = useMemo(() => {
    if (!selectedCategoryId) {
      return draftPosts;
    }

    return draftPosts.filter((post) => post.category?.id === selectedCategoryId);
  }, [draftPosts, selectedCategoryId]);

  const handleBackgroundUpload = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!backgroundFile) {
      showToast({
        message: "Bitte wähle zuerst ein Hintergrundbild aus.",
        type: "error",
      });
      return;
    }

    setUploadingBackground(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const fileExtension = backgroundFile.name.split(".").pop();
      const filePath = `${authData?.user?.id ?? "anonymous"}/blog-background-${Date.now()}.${
        fileExtension ?? "jpg"
      }`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(backgroundBucket)
        .upload(filePath, backgroundFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(backgroundBucket)
        .getPublicUrl(uploadData?.path ?? filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Die öffentliche URL für das Hintergrundbild fehlt.");
      }

      const { data, error } = await supabase
        .from("blog_backgrounds")
        .upsert(
          {
            id: background?.id,
            singleton_key: "blog",
            file_path: uploadData?.path ?? filePath,
            public_url: publicUrl,
          },
          { onConflict: "singleton_key" },
        )
        .select("id, file_path, public_url")
        .single();

      if (error) {
        throw error;
      }

      setBackground(data);
      setBackgroundFile(null);

      if (authData?.user) {
        await logUserAction({
          action: "blog_background_uploaded",
          context: "admin",
          userId: authData.user.id,
          userEmail: authData.user.email ?? null,
          entityType: "blog_backgrounds",
          entityId: data.id,
          metadata: {
            filePath: uploadData?.path ?? filePath,
            publicUrl,
          },
        });
      }

      showToast({
        message: "Hintergrundbild gespeichert.",
        type: "success",
      });
    } catch (error) {
      console.error("Fehler beim Hochladen des Blog-Hintergrunds:", error);
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Das Hintergrundbild konnte nicht hochgeladen werden.",
        type: "error",
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleBackgroundDelete = async () => {
    if (!background?.file_path) {
      return;
    }

    setDeletingBackground(true);

    try {
      const { data: authData } = await supabase.auth.getUser();

      const { error: storageError } = await supabase.storage
        .from(backgroundBucket)
        .remove([background.file_path]);

      if (storageError) {
        throw storageError;
      }

      const { error } = await supabase
        .from("blog_backgrounds")
        .delete()
        .eq("singleton_key", "blog");

      if (error) {
        throw error;
      }

      setBackground(null);
      setBackgroundFile(null);

      if (authData?.user) {
        await logUserAction({
          action: "blog_background_deleted",
          context: "admin",
          userId: authData.user.id,
          userEmail: authData.user.email ?? null,
          entityType: "blog_backgrounds",
          entityId: background.id,
          metadata: { filePath: background.file_path },
        });
      }

      showToast({
        message: "Hintergrundbild entfernt.",
        type: "success",
      });
    } catch (error) {
      console.error("Fehler beim Löschen des Blog-Hintergrunds:", error);
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Das Hintergrundbild konnte nicht gelöscht werden.",
        type: "error",
      });
    } finally {
      setDeletingBackground(false);
    }
  };

  async function handleSpotlightToggle(post: BlogPostPreview) {
    setUpdatingSpotlightId(post.id);

    try {
      const { data: authData } = await supabase.auth.getUser();

      if (post.spotlight) {
        const { error } = await supabase
          .from("posts")
          .update({ spotlight: false })
          .eq("id", post.id);

        if (error) {
          throw error;
        }

        setPublishedPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, spotlight: false } : p)),
        );
        await logUserAction({
          action: "blog_spotlight_disabled",
          context: "admin",
          userId: authData?.user?.id,
          userEmail: authData?.user?.email ?? null,
          entityType: "blog_post",
          entityId: post.id,
          metadata: { slug: post.slug },
        });
      } else {
        const { error: clearError } = await supabase
          .from("posts")
          .update({ spotlight: false })
          .eq("spotlight", true);

        if (clearError) {
          throw clearError;
        }

        const { error } = await supabase
          .from("posts")
          .update({ spotlight: true })
          .eq("id", post.id);

        if (error) {
          throw error;
        }

        setPublishedPosts((prev) =>
          prev.map((p) => ({ ...p, spotlight: p.id === post.id })),
        );
        await logUserAction({
          action: "blog_spotlight_enabled",
          context: "admin",
          userId: authData?.user?.id,
          userEmail: authData?.user?.email ?? null,
          entityType: "blog_post",
          entityId: post.id,
          metadata: { slug: post.slug },
        });
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Spotlight-Status:", error);
      showToast({
        message:
          "Der Spotlight-Status konnte nicht aktualisiert werden. Bitte später erneut versuchen.",
        type: "error",
      });
      const message = error instanceof Error ? error.message : String(error);
      const { data: authData } = await supabase.auth.getUser();
      await logUserAction({
        action: "blog_spotlight_update_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "blog_post",
        entityId: post.id,
        metadata: { slug: post.slug, error: message },
      });
    } finally {
      setUpdatingSpotlightId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-content">Überprüfung läuft...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className={`admin-content ${blogStyles.blogContent}`}>
        <header className="adminPageHeader">
          <h1>Blog Manager</h1>
          <Link className={blogStyles.newBlogButton} href="/asdf/blog/neuer-artikel">
            <i className="bi bi-plus-circle"></i> Neuer Artikel
          </Link>
        </header>

        <section className={blogStyles.backgroundSection}>
          <div className={blogStyles.backgroundHeader}>
            <div>
              <h2>Hintergrundbild</h2>
              <p className={blogStyles.backgroundHint}>
                Das Hintergrundbild wird auf der öffentlichen Blog-Seite angezeigt und
                mit einem dunklen Overlay kombiniert. Nutze ein großes, breites Bild,
                damit es auf allen Geräten gut wirkt.
              </p>
            </div>

            {background?.public_url && (
              <button
                type="button"
                className="adminButton"
                onClick={handleBackgroundDelete}
                disabled={deletingBackground}
              >
                {deletingBackground ? "Entferne..." : "Bild entfernen"}
              </button>
            )}
          </div>

          {background?.public_url ? (
            <div className={blogStyles.backgroundPreview}>
              <div
                className={blogStyles.backgroundImage}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(8,11,18,0.35), rgba(8,11,18,0.65)), url(${background.public_url})`,
                }}
                role="img"
                aria-label="Aktueller Blog Hintergrund"
              />
              <p className={blogStyles.backgroundPath}>{background.file_path}</p>
            </div>
          ) : (
            <p className={blogStyles.backgroundPlaceholder}>
              Es ist noch kein Hintergrundbild hinterlegt.
            </p>
          )}

          <form className={blogStyles.backgroundForm} onSubmit={handleBackgroundUpload}>
            <label className="admin-file-input">
              <span>Datei auswählen</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setBackgroundFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="submit"
              className="adminButton"
              disabled={uploadingBackground}
            >
              {uploadingBackground ? "Lade hoch..." : "Hintergrund speichern"}
            </button>
          </form>
        </section>

        <section className={blogStyles.filterSection}>
          <label className={blogStyles.filterControl}>
            Kategorie filtern
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">Alle Kategorien</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {categoriesError && (
            <p className={blogStyles.errorText}>{categoriesError}</p>
          )}
        </section>

        <section className={blogStyles.blogSection}>
          <h2>Veröffentlichte Artikel</h2>

          {fetchingPublished && <p>Lade veröffentlichte Artikel...</p>}

          {!fetchingPublished && publishedError && (
            <p className={blogStyles.errorText}>{publishedError}</p>
          )}

          {!fetchingPublished &&
            !publishedError &&
            filteredPublishedPosts.length === 0 && (
            <p className={blogStyles.emptyState}>Es wurden noch keine Artikel veröffentlicht.</p>
          )}

          {!fetchingPublished &&
            !publishedError &&
            filteredPublishedPosts.length > 0 && (
            <div className={blogStyles.blogGrid}>
              {filteredPublishedPosts.map((post) => (
                <article key={post.id} className={blogStyles.blogCard}>
                  <Link href={`/asdf/blog/${post.id}`} className={blogStyles.blogCardMain}>
                    <div
                      className={blogStyles.blogCardImage}
                      style={{
                        backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                      }}
                      aria-hidden={!post.cover_image}
                    />
                  <div className={blogStyles.blogCardBody}>
                    {post.spotlight && (
                      <span className={blogStyles.spotlightBadge}>Spotlight</span>
                    )}
                    {post.category && (
                      <span className={blogStyles.categoryBadge}>{post.category.name}</span>
                    )}
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
                    <Link className={blogStyles.blogCardAction} href={`/asdf/blog/${post.id}`}>
                      Bearbeiten
                    </Link>
                    <label className={blogStyles.spotlightToggle}>
                      <input
                        type="checkbox"
                        checked={post.spotlight}
                        onChange={() => handleSpotlightToggle(post)}
                        disabled={updatingSpotlightId === post.id}
                      />
                      Spotlight
                    </label>
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

          {!fetchingDrafts && !draftError && filteredDraftPosts.length === 0 && (
            <p className={blogStyles.emptyState}>Aktuell sind keine Entwürfe vorhanden.</p>
          )}

          {!fetchingDrafts && !draftError && filteredDraftPosts.length > 0 && (
            <div className={blogStyles.blogGrid}>
              {filteredDraftPosts.map((post) => (
                <article key={post.id} className={blogStyles.blogCard}>
                  <Link href={`/asdf/blog/${post.id}`} className={blogStyles.blogCardMain}>
                    <div
                      className={blogStyles.blogCardImage}
                      style={{
                        backgroundImage: post.cover_image ? `url(${post.cover_image})` : undefined,
                      }}
                      aria-hidden={!post.cover_image}
                    />
                    <div className={blogStyles.blogCardBody}>
                      {post.category && (
                        <span className={blogStyles.categoryBadge}>{post.category.name}</span>
                      )}
                      <h3 className={blogStyles.blogCardTitle}>{post.title}</h3>
                      <p className={blogStyles.blogCardMeta}>Entwurf</p>
                      {post.excerpt && <p className={blogStyles.blogCardExcerpt}>{post.excerpt}</p>}
                    </div>
                  </Link>
                  <footer className={blogStyles.blogCardFooter}>
                    <Link className={blogStyles.blogCardAction} href={`/asdf/blog/${post.id}`}>
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
