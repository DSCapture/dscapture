"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import styles from "../neuer-artikel/page.module.css";
import "../../adminComponents/adminPageHader.css";

type PostStatus = "draft" | "published" | "archived";

export default function BlogEditPage() {
  const { loading: verifying } = useVerifyAdminAccess();
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
        .select("id, title, slug, excerpt, content, cover_image, status, published_at")
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

    if (!userId) {
      alert(
        "Fehler beim Hochladen des Cover-Bildes: Benutzerinformation nicht gefunden. Bitte erneut anmelden.",
      );
      setSaving(false);
      return;
    }

    const bucketName = "blog-cover-images";

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
        .from(bucketName)
        .upload(filePath, coverImageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        alert("Fehler beim Hochladen des Cover-Bildes: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData?.path ?? filePath);

      coverImageUrl = publicUrlData?.publicUrl ?? null;

      if (!coverImageUrl) {
        alert("Fehler beim Ermitteln der öffentlichen Bild-URL.");
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

    const { error } = await supabase.from("posts").update(updates).eq("id", postId);

    if (error) {
      alert("Fehler beim Speichern des Artikels: " + error.message);
      setSaving(false);
      return;
    }

    alert("Artikel erfolgreich aktualisiert!");
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

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert("Fehler beim Löschen des Artikels: " + error.message);
      setDeleting(false);
      return;
    }

    alert("Artikel erfolgreich gelöscht.");
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
      <div className={`admin-content ${styles.blogContent}`}>
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
