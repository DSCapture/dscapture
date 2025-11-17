"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import type { PageMetadataRow } from "@/lib/pageMetadata";
import styles from "./metadata.module.css";

type MetadataFormState = {
  slug: string;
  title: string;
  description: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  canonicalUrl: string;
  keywords: string;
};

const initialFormState: MetadataFormState = {
  slug: "",
  title: "",
  description: "",
  openGraphTitle: "",
  openGraphDescription: "",
  openGraphImageUrl: "",
  canonicalUrl: "",
  keywords: "",
};

const slugSuggestions: Array<{ slug: string; label: string }> = [
  { slug: "home", label: "Startseite" },
  { slug: "blog", label: "Blog Übersicht" },
  { slug: "portfolio", label: "Portfolio" },
  { slug: "kontakt", label: "Kontakt" },
  { slug: "impressum", label: "Impressum" },
  { slug: "datenschutz", label: "Datenschutz" },
];

const mapRowToFormState = (row: PageMetadataRow): MetadataFormState => ({
  slug: row.slug,
  title: row.title ?? "",
  description: row.description ?? "",
  openGraphTitle: row.open_graph_title ?? "",
  openGraphDescription: row.open_graph_description ?? "",
  openGraphImageUrl: row.open_graph_image_url ?? "",
  canonicalUrl: row.canonical_url ?? "",
  keywords: row.keywords ?? "",
});

export default function AdminMetadataPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const [entries, setEntries] = useState<PageMetadataRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [formState, setFormState] = useState<MetadataFormState>(initialFormState);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data, error: fetchError } = await supabase
      .from("page_metadata")
      .select(
        "slug, title, description, open_graph_title, open_graph_description, open_graph_image_url, canonical_url, keywords",
      )
      .order("slug", { ascending: true });

    if (fetchError) {
      console.error("Fehler beim Laden der Metadaten:", fetchError.message);
      setError("Die vorhandenen Metadaten konnten nicht geladen werden.");
      setEntries([]);
    } else {
      setEntries(data ?? []);
    }

    setLoadingEntries(false);
  }, []);

  useEffect(() => {
    if (!verifying) {
      void loadEntries();
    }
  }, [verifying, loadEntries]);

  const resetForm = useCallback((presetSlug = "") => {
    setFormState({ ...initialFormState, slug: presetSlug });
    setActiveSlug(null);
    setFeedback(null);
    setError(null);
  }, []);

  const handleSelectEntry = useCallback(
    (slug: string) => {
      const entry = entries.find((item) => item.slug === slug);
      if (!entry) {
        return;
      }

      setFormState(mapRowToFormState(entry));
      setActiveSlug(slug);
      setFeedback(null);
      setError(null);
    },
    [entries],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedSlug = formState.slug.trim();

    if (!trimmedSlug) {
      setError("Bitte gib einen Slug an.");
      setFeedback(null);
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(null);

    const payload = {
      slug: trimmedSlug,
      title: formState.title.trim() || null,
      description: formState.description.trim() || null,
      open_graph_title: formState.openGraphTitle.trim() || null,
      open_graph_description: formState.openGraphDescription.trim() || null,
      open_graph_image_url: formState.openGraphImageUrl.trim() || null,
      canonical_url: formState.canonicalUrl.trim() || null,
      keywords: formState.keywords.trim() || null,
    } satisfies Omit<PageMetadataRow, "slug"> & { slug: string };

    const { data: authData } = await supabase.auth.getUser();

    const { data, error: upsertError } = await supabase
      .from("page_metadata")
      .upsert(payload, { onConflict: "slug" })
      .select(
        "slug, title, description, open_graph_title, open_graph_description, open_graph_image_url, canonical_url, keywords",
      )
      .single<PageMetadataRow>();

    setSaving(false);

    if (upsertError) {
      console.error("Fehler beim Speichern der Metadaten:", upsertError.message);
      setError("Die Metadaten konnten nicht gespeichert werden.");
      await logUserAction({
        action: "page_metadata_save_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "page_metadata",
        entityId: trimmedSlug,
        metadata: { error: upsertError.message },
      });
      return;
    }

    if (data) {
      setEntries((previous) => {
        const withoutCurrent = previous.filter((entry) => entry.slug !== data.slug);
        const updated = [...withoutCurrent, data];
        return updated.sort((a, b) => a.slug.localeCompare(b.slug));
      });
      setFormState(mapRowToFormState(data));
      setActiveSlug(data.slug);
      setFeedback("Metadaten wurden gespeichert.");
      await logUserAction({
        action: "page_metadata_saved",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "page_metadata",
        entityId: data.slug,
      });
    }
  };

  const handleDelete = async () => {
    const slugToDelete = activeSlug ?? formState.slug.trim();
    if (!slugToDelete) {
      return;
    }

    const entryExists = entries.some((entry) => entry.slug === slugToDelete);
    if (!entryExists) {
      return;
    }

    if (!window.confirm("Soll dieser Metadaten-Eintrag wirklich gelöscht werden?")) {
      return;
    }

    setDeleting(true);
    setFeedback(null);
    setError(null);

    const { data: authData } = await supabase.auth.getUser();

    const { error: deleteError } = await supabase
      .from("page_metadata")
      .delete()
      .eq("slug", slugToDelete);

    setDeleting(false);

    if (deleteError) {
      console.error("Fehler beim Löschen der Metadaten:", deleteError.message);
      setError("Der Metadaten-Eintrag konnte nicht gelöscht werden.");
      await logUserAction({
        action: "page_metadata_delete_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "page_metadata",
        entityId: slugToDelete,
        metadata: { error: deleteError.message },
      });
      return;
    }

    setEntries((previous) => previous.filter((entry) => entry.slug !== slugToDelete));
    resetForm();
    setFeedback("Metadaten-Eintrag wurde gelöscht.");
    await logUserAction({
      action: "page_metadata_deleted",
      context: "admin",
      userId: authData?.user?.id,
      userEmail: authData?.user?.email ?? null,
      entityType: "page_metadata",
      entityId: slugToDelete,
    });
  };

  const isExistingEntry = useMemo(
    () => entries.some((entry) => entry.slug === formState.slug.trim()),
    [entries, formState.slug],
  );

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
      <div className="admin-content">
        <div className="admin-card">
          <div className={styles.container}>
            <header>
              <h1>Metadaten verwalten</h1>
              <p>
                Pflege hier Titel, Beschreibungen und Open-Graph-Daten für die öffentlichen Seiten. Alle Änderungen
                werden direkt in Supabase gespeichert.
              </p>
            </header>

            <div className={styles.layout}>
              <aside className={styles.entryList}>
                <div className={styles.entryListHeader}>
                  <h2>Seiten</h2>
                  <button type="button" className={styles.newButton} onClick={() => resetForm()}>
                    Neue Seite
                  </button>
                </div>

                {loadingEntries ? (
                  <p>Metadaten werden geladen...</p>
                ) : entries.length === 0 ? (
                  <p>Noch keine Metadaten hinterlegt.</p>
                ) : (
                  <ul className={styles.list}>
                    {entries.map((entry) => (
                      <li key={entry.slug}>
                        <button
                          type="button"
                          className={`${styles.entryButton} ${
                            activeSlug === entry.slug ? styles.entryButtonActive : ""
                          }`}
                          onClick={() => handleSelectEntry(entry.slug)}
                        >
                          <span className={styles.entrySlug}>{entry.slug}</span>
                          <span className={styles.entryTitle}>
                            {entry.title?.length ? entry.title : "Kein Titel hinterlegt"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className={styles.suggestions}>
                  <span>Empfohlene Slugs</span>
                  <div className={styles.suggestionButtons}>
                    {slugSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.slug}
                        type="button"
                        className={styles.suggestionButton}
                        onClick={() => resetForm(suggestion.slug)}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.helperText}>
                    Für Blog-Artikel verwende das Muster <code>blog/dein-artikel</code>.
                  </p>
                </div>
              </aside>

              <form className={styles.formCard} onSubmit={handleSave}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="slug">Slug*</label>
                  <input
                    id="slug"
                    name="slug"
                    value={formState.slug}
                    onChange={handleInputChange}
                    placeholder="z. B. home oder blog/mein-artikel"
                  />
                  <p className={styles.helperText}>
                    Der Slug entspricht dem URL-Pfad ohne führenden Schrägstrich.
                  </p>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="title">Seitentitel</label>
                  <input
                    id="title"
                    name="title"
                    value={formState.title}
                    onChange={handleInputChange}
                    placeholder="z. B. Kontakt | DS_Capture"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="description">Beschreibung</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    placeholder="Kurze Zusammenfassung für Suchmaschinen."
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="openGraphTitle">Open Graph Titel</label>
                  <input
                    id="openGraphTitle"
                    name="openGraphTitle"
                    value={formState.openGraphTitle}
                    onChange={handleInputChange}
                    placeholder="Titel für Social Media Vorschaubilder"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="openGraphDescription">Open Graph Beschreibung</label>
                  <textarea
                    id="openGraphDescription"
                    name="openGraphDescription"
                    value={formState.openGraphDescription}
                    onChange={handleInputChange}
                    placeholder="Beschreibung für Social Media Vorschaubilder"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="openGraphImageUrl">Open Graph Bild URL</label>
                  <input
                    id="openGraphImageUrl"
                    name="openGraphImageUrl"
                    value={formState.openGraphImageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                  <p className={styles.helperText}>Öffentliche URL zum Vorschaubild.</p>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="canonicalUrl">Canonical URL</label>
                  <input
                    id="canonicalUrl"
                    name="canonicalUrl"
                    value={formState.canonicalUrl}
                    onChange={handleInputChange}
                    placeholder="https://ds-capture.de/..."
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="keywords">Keywords</label>
                  <input
                    id="keywords"
                    name="keywords"
                    value={formState.keywords}
                    onChange={handleInputChange}
                    placeholder="Kommagetrennte Schlagwörter"
                  />
                  <p className={styles.helperText}>Beispiel: fotografie, branding, agentur</p>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving || !formState.slug.trim()}
                  >
                    {saving ? "Speichern..." : "Metadaten speichern"}
                  </button>

                  {isExistingEntry ? (
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? "Löschen..." : "Eintrag löschen"}
                    </button>
                  ) : null}
                </div>

                {feedback && <p className={styles.feedback}>{feedback}</p>}
                {error && <p className={styles.error}>{error}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
