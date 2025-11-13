"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { createSlug } from "@/lib/slug";
import type { BlogCategory } from "@/lib/blogCategories";
import { useToast } from "@/components/toast/ToastProvider";

import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import styles from "../neuer-artikel/page.module.css";
import "../../adminComponents/adminPageHader.css";

type PostStatus = "draft" | "published" | "archived";

const blogCoverBucket = "blog-cover-images";

function getBlogCoverFilePath(publicUrl: string): string | null {
  if (!publicUrl) {
    return null;
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return null;
    }

    const parsedUrl = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${blogCoverBucket}/`;
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const markerIndex = pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const filePath = pathname.slice(markerIndex + marker.length);
    return filePath || null;
  } catch (error) {
    console.warn("Konnte den Dateipfad für das Blog-Cover nicht bestimmen:", error);
    return null;
  }
}

export default function BlogEditPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Cookies.get("userId");

  const [postId, setPostId] = useState<number | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState<PostStatus>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const trimmedNewCategoryName = useMemo(
    () => newCategoryName.trim(),
    [newCategoryName],
  );

  useEffect(() => {
    if (verifying) {
      return;
    }

    let isMounted = true;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError(null);

      const { data, error } = await supabase
        .from("blog_categories")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Fehler beim Laden der Kategorien:", error);
        setCategoriesError("Die Kategorien konnten nicht geladen werden.");
        setCategories([]);
      } else {
        setCategories(data ?? []);
      }

      setCategoriesLoading(false);
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [verifying]);

  useEffect(() => {
    if (verifying) {
      return;
    }

    async function loadPost() {
      const numericId = Number(params.id);

      if (!Number.isInteger(numericId)) {
        setFetchError("Ungültige Artikel-ID.");
        setLoadingPost(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, title, slug, excerpt, content, cover_image, status, published_at, category_id, category:blog_categories(id, name, slug)",
        )
        .eq("id", numericId)
        .maybeSingle();

      if (error) {
        console.error("Fehler beim Laden des Artikels:", error);
        setFetchError("Der Artikel konnte nicht geladen werden.");
        setLoadingPost(false);
        return;
      }

      if (!data) {
        setFetchError("Der Artikel wurde nicht gefunden.");
        setLoadingPost(false);
        return;
      }

      setPostId(data.id);
      setTitle(data.title ?? "");
      setSlug(data.slug ?? "");
      setExcerpt(data.excerpt ?? "");
      setContent(data.content ?? "");
      setCoverImage(data.cover_image ?? "");
      setStatus((data.status as PostStatus) ?? "draft");
      setPublishedAt(data.published_at ?? null);
      setSelectedCategoryId((data.category_id as string | null) ?? "");
      setFetchError(null);
      setLoadingPost(false);
    }

    loadPost();
  }, [params.id, verifying]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9äöüß ]/gi, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!postId) {
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData?.user ?? null;

    if (!userId) {
      showToast({
        message:
          "Fehler beim Hochladen des Cover-Bildes: Benutzerinformation nicht gefunden. Bitte erneut anmelden.",
        type: "error",
      });
      await logUserAction({
        action: "blog_post_update_missing_user",
        context: "admin",
        userId: activeUser?.id ?? null,
        userEmail: activeUser?.email ?? null,
        entityType: "blog_post",
        entityId: postId,
        metadata: { slug },
      });
      setSaving(false);
      return;
    }

    let coverImageUrl = coverImage.trim() ? coverImage.trim() : null;

    if (coverImageFile) {
      const fileExt = coverImageFile.name.split(".").pop();
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const baseFileName = slug || title || "cover-image";
      const sanitizedFileName = baseFileName
        .toLowerCase()
        .replace(/[^a-z0-9äöüß-]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const fileName = `${sanitizedFileName || "cover-image"}-${uniqueSuffix}.${
        fileExt || "png"
      }`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(blogCoverBucket)
        .upload(filePath, coverImageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        showToast({
          message: "Fehler beim Hochladen des Cover-Bildes: " + uploadError.message,
          type: "error",
        });
        await logUserAction({
          action: "blog_post_cover_upload_failed",
          context: "admin",
          userId: activeUser?.id ?? userId,
          userEmail: activeUser?.email ?? null,
          entityType: "blog_post",
          entityId: postId,
          metadata: { slug, error: uploadError.message },
        });
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(blogCoverBucket)
        .getPublicUrl(uploadData?.path ?? filePath);

      coverImageUrl = publicUrlData?.publicUrl ?? null;

      if (!coverImageUrl) {
        showToast({
          message: "Fehler beim Ermitteln der öffentlichen Bild-URL.",
          type: "error",
        });
        await logUserAction({
          action: "blog_post_cover_url_failed",
          context: "admin",
          userId: activeUser?.id ?? userId,
          userEmail: activeUser?.email ?? null,
          entityType: "blog_post",
          entityId: postId,
          metadata: { slug },
        });
        setSaving(false);
        return;
      }

      setCoverImage(coverImageUrl);
      setCoverImageFile(null);
    }

    const updates: {
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      cover_image: string | null;
      status: PostStatus;
      published_at?: string | null;
      category_id?: string | null;
    } = {
      title,
      slug,
      excerpt: excerpt.trim() ? excerpt : null,
      content,
      cover_image: coverImageUrl,
      status,
    };

    if (status === "published") {
      updates.published_at = publishedAt ?? new Date().toISOString();
    } else {
      updates.published_at = null;
    }

    updates.category_id = selectedCategoryId || null;

    const { error } = await supabase.from("posts").update(updates).eq("id", postId);

    if (error) {
      showToast({
        message: "Fehler beim Speichern des Artikels: " + error.message,
        type: "error",
      });
      await logUserAction({
        action: "blog_post_update_failed",
        context: "admin",
        userId: activeUser?.id ?? userId,
        userEmail: activeUser?.email ?? null,
        entityType: "blog_post",
        entityId: postId,
        metadata: { slug, error: error.message },
      });
      setSaving(false);
      return;
    }

    await logUserAction({
      action: "blog_post_updated",
      context: "admin",
      userId: activeUser?.id ?? userId,
      userEmail: activeUser?.email ?? null,
      entityType: "blog_post",
      entityId: postId,
      metadata: {
        slug,
        status,
        hasCoverImage: Boolean(coverImageUrl),
        categoryId: selectedCategoryId || null,
      },
    });

    showToast({
      message: "Artikel erfolgreich aktualisiert!",
      type: "success",
    });
    setPublishedAt(updates.published_at ?? null);
    setSaving(false);
  }

  async function handleDelete() {
    if (!postId) {
      return;
    }

    const confirmed = confirm(
      "Möchten Sie diesen Artikel wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData?.user ?? null;

    const coverFilePath = coverImage ? getBlogCoverFilePath(coverImage) : null;

    if (coverFilePath) {
      const { error: coverDeleteError } = await supabase.storage
        .from(blogCoverBucket)
        .remove([coverFilePath]);

      if (
        coverDeleteError &&
        !coverDeleteError.message?.toLowerCase().includes("not found")
      ) {
        showToast({
          message:
            "Fehler beim Entfernen des Cover-Bildes: " + coverDeleteError.message,
          type: "error",
        });
        await logUserAction({
          action: "blog_post_cover_delete_failed",
          context: "admin",
          userId: activeUser?.id ?? userId,
          userEmail: activeUser?.email ?? null,
          entityType: "blog_post",
          entityId: postId,
          metadata: { slug, error: coverDeleteError.message },
        });
        setDeleting(false);
        return;
      }
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      showToast({
        message: "Fehler beim Löschen des Artikels: " + error.message,
        type: "error",
      });
      await logUserAction({
        action: "blog_post_delete_failed",
        context: "admin",
        userId: activeUser?.id ?? userId,
        userEmail: activeUser?.email ?? null,
        entityType: "blog_post",
        entityId: postId,
        metadata: { slug, error: error.message },
      });
      setDeleting(false);
      return;
    }

    await logUserAction({
      action: "blog_post_deleted",
      context: "admin",
      userId: activeUser?.id ?? userId,
      userEmail: activeUser?.email ?? null,
      entityType: "blog_post",
      entityId: postId,
      metadata: { slug },
    });

    showToast({
      message: "Artikel erfolgreich gelöscht.",
      type: "success",
    });
    setDeleting(false);
    router.push("/admin/blog");
  }

  if (verifying) {
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
      <div className={`admin-content`}>
        <header className="adminPageHeader">
          <h1>Artikel bearbeiten</h1>
          <Link className={styles.abortButton} href="/admin/blog">
            <i className="bi bi-arrow-left-circle"></i> Zur Übersicht
          </Link>
        </header>

        {loadingPost && <p>Lade Artikel....</p>}

        {!loadingPost && fetchError && <p className={styles.errorText}>{fetchError}</p>}

        {!loadingPost && !fetchError && postId !== null && (
          <form onSubmit={handleSave} className={styles.blogForm}>
            <label>
              Titel
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </label>

            <label>
              Slug
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </label>

            <label>
              Auszug
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Kurze Beschreibung oder Teasertext..."
              />
            </label>

            <label>
              Inhalt
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Hier den Artikel schreiben..."
                required
              />
            </label>

            <label>
              Cover Image hochladen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <label>
              Cover Image URL (optional)
              <input
                type="url"
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  if (coverImageFile) {
                    setCoverImageFile(null);
                  }
                }}
                placeholder="https://..."
              />
            </label>

            <section className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <label>
                  Kategorie (optional)
                  <select
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="">Keine Kategorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className={styles.categoryActionButton}
                  onClick={() => setShowNewCategoryForm((prev) => !prev)}
                >
                  {showNewCategoryForm ? "Abbrechen" : "Neue Kategorie"}
                </button>
              </div>

              {showNewCategoryForm && (
                <div className={styles.newCategoryForm}>
                  <input
                    type="text"
                    placeholder="Name der Kategorie"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    disabled={savingCategory}
                  />
                  <button
                    type="button"
                    className="primaryButton"
                    disabled={savingCategory || !trimmedNewCategoryName}
                    onClick={async () => {
                      const trimmedName = trimmedNewCategoryName;

                      if (!trimmedName) {
                        return;
                      }

                      setSavingCategory(true);
                      setCategoriesError(null);

                      const slug = createSlug(trimmedName);

                      const { data, error } = await supabase
                        .from("blog_categories")
                        .insert({
                          name: trimmedName,
                          slug,
                        })
                        .select()
                        .maybeSingle();

                      if (error) {
                        console.error("Fehler beim Anlegen der Kategorie:", error);
                        setCategoriesError(
                          error.code === "23505"
                            ? "Eine Kategorie mit diesem Namen oder Slug existiert bereits."
                            : "Die Kategorie konnte nicht erstellt werden.",
                        );
                        setSavingCategory(false);
                        return;
                      }

                      const createdCategory = data as BlogCategory | null;

                      if (createdCategory) {
                        setCategories((prev) =>
                          [...prev, createdCategory].sort((a, b) =>
                            a.name.localeCompare(b.name, "de", { sensitivity: "base" }),
                          ),
                        );
                        setSelectedCategoryId(createdCategory.id);
                      }

                      setNewCategoryName("");
                      setShowNewCategoryForm(false);
                      setSavingCategory(false);
                    }}
                  >
                    {savingCategory ? "Speichere..." : "Kategorie hinzufügen"}
                  </button>
                </div>
              )}

              {categoriesError && (
                <p className={styles.errorText}>{categoriesError}</p>
              )}
            </section>

            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
                <option value="draft">Entwurf</option>
                <option value="published">Veröffentlicht</option>
                <option value="archived">Archiviert</option>
              </select>
            </label>

            {publishedAt && status === "published" && (
              <p className={styles.metaInfo}>Veröffentlicht am {dateFormatter.format(new Date(publishedAt))}</p>
            )}

            <div className={styles.buttonRow}>
              <button type="submit" className="primaryButton" disabled={saving}>
                {saving ? "Speichere..." : "Änderungen speichern"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteButton}
                disabled={deleting}
              >
                {deleting ? "Lösche..." : "Artikel löschen"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
