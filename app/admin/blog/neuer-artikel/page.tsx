"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import styles from "./page.module.css";
import "../../adminComponents/adminPageHader.css";
import Cookies from "js-cookie";
import { createSlug } from "@/lib/slug";
import type { BlogCategory } from "@/lib/blogCategories";

export default function BlogCreatePage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const userId = Cookies.get("userId");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
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

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(createSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!userId) {
      alert(
        "Fehler beim Hochladen des Cover-Bildes: Benutzerinformation nicht gefunden. Bitte erneut anmelden.",
      );
      setLoading(false);
      return;
    }

    const bucketName = "blog-cover-images";

    let coverImageUrl = coverImage.trim() ? coverImage.trim() : null;

    if (coverImageFile) {
      const fileExt = coverImageFile.name.split(".").pop();
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
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
        alert(
          "Fehler beim Hochladen des Cover-Bildes: " + uploadError.message,
        );
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData?.path ?? filePath);

      coverImageUrl = publicUrlData?.publicUrl ?? null;

      if (coverImageUrl) {
        setCoverImage(coverImageUrl);
      } else {
        alert("Fehler beim Ermitteln der öffentlichen Bild-URL.");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.from("posts").insert([
      {
        author_id: userId,
        title,
        slug,
        excerpt,
        content,
        cover_image: coverImageUrl,
        status,
        spotlight: false,
        published_at: status === "published" ? new Date().toISOString() : null,
        category_id: selectedCategoryId || null,
      },
    ]);

    if (error) {
      alert("Fehler beim Erstellen des Artikels: " + error.message);
      setLoading(false);
      return;
    }

    alert("Artikel erfolgreich erstellt!");
    setLoading(false);
    setCoverImageFile(null);
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
          <h1>Neuer Artikel</h1>
          <Link className={styles.abortButton} href="/admin/blog">
            <i className="bi bi-x-circle"></i> Abbrechen
          </Link>
        </header>

        <form onSubmit={handleSubmit} className={styles.blogForm}>
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
              onChange={(e) =>
                setCoverImageFile(e.target.files?.[0] ? e.target.files[0] : null)
              }
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
                    if (!trimmedNewCategoryName) {
                      return;
                    }

                    setSavingCategory(true);
                    setCategoriesError(null);

                    const slug = createSlug(trimmedNewCategoryName);

                    const { data, error } = await supabase
                      .from("blog_categories")
                      .insert({
                        name: trimmedNewCategoryName,
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
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
          </label>

          <button type="submit" disabled={loading} className="primaryButton">
            {loading ? "Speichere..." : "Artikel erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
