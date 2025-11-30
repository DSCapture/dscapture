"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import styles from "./page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/toast/ToastProvider";
import { logUserAction } from "@/lib/logger";

const bucketName = "homepage-gallery";

type HomepageGalleryItem = {
  id: string;
  publicUrl: string;
  filePath: string;
  altText: string;
  displayOrder: number;
  createdAt: string;
};

export default function AdminHomepageGalleryPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();
  const [galleryItems, setGalleryItems] = useState<HomepageGalleryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const nextDisplayOrder = useMemo(() => {
    const highestOrder = galleryItems.reduce(
      (max, item) => Math.max(max, item.displayOrder),
      0,
    );

    return highestOrder + 1;
  }, [galleryItems]);

  useEffect(() => {
    if (verifying) {
      return;
    }

    const fetchGalleryItems = async () => {
      setLoadingItems(true);

      try {
        const { data, error } = await supabase
          .from("homepage_gallery_images")
          .select("id, public_url, file_path, alt_text, display_order, created_at")
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        const normalized = (data ?? []).map((record) => ({
          id: record.id,
          publicUrl: record.public_url ?? "",
          filePath: record.file_path ?? "",
          altText: record.alt_text?.trim() ?? "",
          displayOrder: record.display_order ?? 0,
          createdAt: record.created_at ?? new Date().toISOString(),
        } satisfies HomepageGalleryItem));

        setGalleryItems(normalized);
        setItemsError(null);
      } catch (error) {
        console.error("Fehler beim Laden der Galerie-Bilder:", error);
        setItemsError("Die Galerie-Bilder konnten nicht geladen werden.");
      } finally {
        setLoadingItems(false);
      }
    };

    void fetchGalleryItems();
  }, [verifying]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!uploadFile) {
      showToast({
        message: "Bitte wähle zuerst eine Bilddatei aus.",
        type: "error",
      });
      return;
    }

    const trimmedAltText = uploadAltText.trim();

    if (!trimmedAltText) {
      showToast({
        message: "Bitte hinterlege einen Alternativtext.",
        type: "error",
      });
      return;
    }

    setUploading(true);

    let currentUser: { id: string | null; email: string | null } = {
      id: null,
      email: null,
    };

    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      currentUser = {
        id: authData.user?.id ?? null,
        email: authData.user?.email ?? null,
      };

      const fileExt = uploadFile.name.split(".").pop()?.toLowerCase() ?? "webp";
      const baseName = uploadFile.name.split(".").slice(0, -1).join(".") || "gallery";
      const sanitizedBaseName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      const folder = currentUser.id ?? "anonymous";
      const filePath = `${folder}/${sanitizedBaseName || "gallery"}-${timestamp}-${randomSuffix}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const storedPath = uploadData?.path ?? filePath;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storedPath);

      const publicUrl = publicUrlData?.publicUrl ?? null;

      if (!publicUrl) {
        throw new Error("Die öffentliche URL konnte nicht ermittelt werden.");
      }

      const { data: insertData, error: insertError } = await supabase
        .from("homepage_gallery_images")
        .insert({
          file_path: storedPath,
          public_url: publicUrl,
          alt_text: trimmedAltText,
          display_order: nextDisplayOrder,
        })
        .select("id, public_url, file_path, alt_text, display_order, created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      const newItem: HomepageGalleryItem = {
        id: insertData.id,
        publicUrl: insertData.public_url ?? publicUrl,
        filePath: insertData.file_path ?? storedPath,
        altText: insertData.alt_text?.trim() ?? trimmedAltText,
        displayOrder: insertData.display_order ?? nextDisplayOrder,
        createdAt: insertData.created_at ?? new Date().toISOString(),
      };

      setGalleryItems((previous) =>
        [...previous, newItem].sort((a, b) => a.displayOrder - b.displayOrder),
      );

      setUploadAltText("");
      setUploadFile(null);
      event.currentTarget.reset();

      await logUserAction({
        action: "homepage_gallery_image_uploaded",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        entityType: "homepage_gallery_image",
        entityId: newItem.id,
        metadata: {
          filePath: newItem.filePath,
          publicUrl: newItem.publicUrl,
          displayOrder: newItem.displayOrder,
        },
      });

      showToast({
        title: "Bild hinzugefügt",
        message: "Das Galeriebild wurde gespeichert.",
        type: "success",
      });
      setItemsError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Hochladen des Bildes.";

      console.error("Fehler beim Hochladen des Galeriebilds:", message);
      showToast({
        title: "Fehler",
        message,
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFieldChange = (
    id: string,
    field: "altText" | "displayOrder",
    value: string,
  ) => {
    setGalleryItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "displayOrder") {
          const parsed = Number(value);
          return {
            ...item,
            displayOrder: Number.isNaN(parsed) ? item.displayOrder : parsed,
          } satisfies HomepageGalleryItem;
        }

        return { ...item, altText: value } satisfies HomepageGalleryItem;
      }),
    );
  };

  const handleSave = async (
    event: FormEvent<HTMLFormElement>,
    item: HomepageGalleryItem,
  ) => {
    event.preventDefault();

    const trimmedAltText = item.altText.trim();

    if (!trimmedAltText) {
      showToast({
        message: "Bitte trage einen Alternativtext ein.",
        type: "error",
      });
      return;
    }

    if (!Number.isInteger(item.displayOrder) || item.displayOrder < 1) {
      showToast({
        message: "Bitte gib eine Display-Reihenfolge ab 1 an.",
        type: "error",
      });
      return;
    }

    setSavingItemId(item.id);

    let currentUser: { id: string | null; email: string | null } = {
      id: null,
      email: null,
    };

    try {
      const { data: authData } = await supabase.auth.getUser();
      currentUser = {
        id: authData.user?.id ?? null,
        email: authData.user?.email ?? null,
      };

      const { data, error } = await supabase
        .from("homepage_gallery_images")
        .update({
          alt_text: trimmedAltText,
          display_order: item.displayOrder,
        })
        .eq("id", item.id)
        .select("id, public_url, file_path, alt_text, display_order, created_at")
        .single();

      if (error) {
        throw error;
      }

      const updatedItem: HomepageGalleryItem = {
        id: data.id,
        publicUrl: data.public_url ?? item.publicUrl,
        filePath: data.file_path ?? item.filePath,
        altText: data.alt_text?.trim() ?? trimmedAltText,
        displayOrder: data.display_order ?? item.displayOrder,
        createdAt: data.created_at ?? item.createdAt,
      };

      setGalleryItems((previous) =>
        previous
          .map((entry) => (entry.id === updatedItem.id ? updatedItem : entry))
          .sort((a, b) => a.displayOrder - b.displayOrder),
      );

      await logUserAction({
        action: "homepage_gallery_image_updated",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        entityType: "homepage_gallery_image",
        entityId: updatedItem.id,
        metadata: {
          displayOrder: updatedItem.displayOrder,
        },
      });

      showToast({
        title: "Gespeichert",
        message: "Das Galeriebild wurde aktualisiert.",
        type: "success",
      });
      setItemsError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Speichern des Bildes.";

      console.error("Fehler beim Aktualisieren des Galeriebilds:", message);
      showToast({
        title: "Fehler",
        message,
        type: "error",
      });
    } finally {
      setSavingItemId(null);
    }
  };

  const handleDelete = async (item: HomepageGalleryItem) => {
    const confirmed = window.confirm(
      "Möchtest du dieses Galeriebild wirklich löschen?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingItemId(item.id);

    let currentUser: { id: string | null; email: string | null } = {
      id: null,
      email: null,
    };

    try {
      const { data: authData } = await supabase.auth.getUser();
      currentUser = {
        id: authData.user?.id ?? null,
        email: authData.user?.email ?? null,
      };

      const { error } = await supabase
        .from("homepage_gallery_images")
        .delete()
        .eq("id", item.id);

      if (error) {
        throw error;
      }

      if (item.filePath) {
        await supabase.storage.from(bucketName).remove([item.filePath]);
      }

      setGalleryItems((previous) =>
        previous.filter((entry) => entry.id !== item.id),
      );

      await logUserAction({
        action: "homepage_gallery_image_deleted",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email,
        entityType: "homepage_gallery_image",
        entityId: item.id,
        metadata: {
          filePath: item.filePath,
        },
      });

      showToast({
        title: "Gelöscht",
        message: "Das Galeriebild wurde entfernt.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Löschen des Bildes.";

      console.error("Fehler beim Löschen des Galeriebilds:", message);
      showToast({
        title: "Fehler",
        message,
        type: "error",
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-content">
        <div className={styles.galleryContent}>
          <header className={styles.header}>
            <h1>Homepage Galerie</h1>
            <p>
              Verwalte die Bildstrecke unter der Fotografen-Vorstellung. Die Bilder werden im Bucket
              „{bucketName}“ gespeichert und laufen automatisch auf der Homepage durch.
            </p>
          </header>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Neues Galeriebild</h2>
              <p>Füge ein Bild mit Alternativtext hinzu. Die Reihenfolge kannst du später anpassen.</p>
            </div>

            <form className={`${"admin-form"} ${styles.uploadForm}`} onSubmit={handleUpload}>
              <div className="admin-form-row">
                <div className="admin-form-field">
                  <label htmlFor="gallery-file">Bilddatei</label>
                  <input
                    id="gallery-file"
                    name="gallery-file"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="gallery-alt">Alternativtext</label>
                  <input
                    id="gallery-alt"
                    name="gallery-alt"
                    type="text"
                    value={uploadAltText}
                    onChange={(event) => setUploadAltText(event.target.value)}
                    placeholder="z. B. Portrait am Set"
                    required
                  />
                </div>
                <div className="admin-form-field">
                  <label htmlFor="gallery-order">Reihenfolge</label>
                  <input
                    id="gallery-order"
                    name="gallery-order"
                    type="number"
                    value={nextDisplayOrder}
                    min={1}
                    readOnly
                  />
                </div>
              </div>

              <button className="admin-button" type="submit" disabled={uploading || verifying}>
                {uploading ? "Wird hochgeladen..." : "Bild speichern"}
              </button>
            </form>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Bestehende Galerie</h2>
              <p>Bearbeite Alternativtexte oder die Anzeige-Reihenfolge.</p>
            </div>

            {itemsError ? <p className={styles.errorMessage}>{itemsError}</p> : null}

            {loadingItems ? (
              <p>Galerie wird geladen...</p>
            ) : galleryItems.length === 0 ? (
              <p>Aktuell sind keine Galeriebilder hinterlegt.</p>
            ) : (
              <div className={styles.galleryGrid}>
                {galleryItems.map((item) => (
                  <form
                    key={item.id}
                    className={`${"admin-form"} ${styles.galleryCard}`}
                    onSubmit={(event) => handleSave(event, item)}
                  >
                    <div className={styles.imagePreview}>
                      {item.publicUrl ? (
                        <Image
                          src={item.publicUrl}
                          alt={item.altText || "Galeriebild"}
                          fill
                          sizes="(max-width: 900px) 100vw, 320px"
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>Kein Bild</div>
                      )}
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor={`alt-${item.id}`}>Alternativtext</label>
                      <input
                        id={`alt-${item.id}`}
                        type="text"
                        value={item.altText}
                        onChange={(event) =>
                          handleFieldChange(item.id, "altText", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor={`order-${item.id}`}>Reihenfolge</label>
                      <input
                        id={`order-${item.id}`}
                        type="number"
                        min={1}
                        value={item.displayOrder}
                        onChange={(event) =>
                          handleFieldChange(item.id, "displayOrder", event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        type="submit"
                        className="admin-button"
                        disabled={savingItemId === item.id}
                      >
                        {savingItemId === item.id ? "Speichern..." : "Speichern"}
                      </button>
                      <button
                        type="button"
                        className="admin-button secondary"
                        onClick={() => handleDelete(item)}
                        disabled={deletingItemId === item.id}
                      >
                        {deletingItemId === item.id ? "Löschen..." : "Löschen"}
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
