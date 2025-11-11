"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";

type HomepageImageType = "background" | "overlay";

const bucketName = "homepage-assets";

interface HomepageImage {
  image_type: HomepageImageType;
  public_url: string;
  file_path: string;
}

interface HomepageUspRecord {
  id: string;
  title: string;
  description: string;
  display_order: number;
}

interface HomepageUspFormItem {
  id: string | null;
  displayOrder: number;
  title: string;
  description: string;
}

const INITIAL_USP_ITEMS: HomepageUspFormItem[] = [
  { id: null, displayOrder: 1, title: "", description: "" },
  { id: null, displayOrder: 2, title: "", description: "" },
  { id: null, displayOrder: 3, title: "", description: "" },
];

export default function AdminHomepagePage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const [backgroundImage, setBackgroundImage] = useState<HomepageImage | null>(
    null,
  );
  const [overlayImage, setOverlayImage] = useState<HomepageImage | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState(false);
  const [deletingOverlay, setDeletingOverlay] = useState(false);
  const [uspItems, setUspItems] = useState<HomepageUspFormItem[]>([...
    INITIAL_USP_ITEMS,
  ]);
  const [loadingUsps, setLoadingUsps] = useState(true);
  const [uspError, setUspError] = useState<string | null>(null);
  const [savingUspDisplayOrder, setSavingUspDisplayOrder] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("image_type, public_url, file_path");

      if (error) {
        console.error("Fehler beim Laden der Homepage-Bilder:", error.message);
        return;
      }

      data?.forEach((item) => {
        if (item.image_type === "background") {
          setBackgroundImage(item as HomepageImage);
        }
        if (item.image_type === "overlay") {
          setOverlayImage(item as HomepageImage);
        }
      });
    };

    const fetchUsps = async () => {
      setLoadingUsps(true);

      try {
        const { data, error } = await supabase
          .from("homepage_usps")
          .select("id, title, description, display_order")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }

        const byOrder = new Map<number, HomepageUspRecord>();
        data?.forEach((record) => {
          byOrder.set(record.display_order, record as HomepageUspRecord);
        });

        setUspItems((previous) =>
          previous.map((item) => {
            const record = byOrder.get(item.displayOrder);

            if (!record) {
              return item;
            }

            return {
              id: record.id,
              displayOrder: record.display_order,
              title: record.title ?? "",
              description: record.description ?? "",
            };
          }),
        );
        setUspError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Laden der USP-Punkte.";
        console.error("Fehler beim Laden der USP-Punkte:", message);
        setUspError("Die USP-Punkte konnten nicht geladen werden.");
      } finally {
        setLoadingUsps(false);
      }
    };

    fetchImages();
    void fetchUsps();
  }, []);

  const handleUspFieldChange = (
    displayOrder: number,
    field: "title" | "description",
    value: string,
  ) => {
    setUspItems((previous) =>
      previous.map((item) => {
        if (item.displayOrder !== displayOrder) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const handleUspSubmit = async (
    event: FormEvent<HTMLFormElement>,
    formItem: HomepageUspFormItem,
  ) => {
    event.preventDefault();

    const trimmedTitle = formItem.title.trim();
    const trimmedDescription = formItem.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      alert("Bitte fülle Titel und Beschreibung aus.");
      return;
    }

    setSavingUspDisplayOrder(formItem.displayOrder);

    let currentUser: { id: string; email?: string | null } | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          userError?.message ?? "Es konnte kein angemeldeter Nutzer ermittelt werden.",
        );
      }

      currentUser = { id: user.id, email: user.email };

      const payload: Record<string, string | number> = {
        title: trimmedTitle,
        description: trimmedDescription,
        display_order: formItem.displayOrder,
      };

      if (formItem.id) {
        payload.id = formItem.id;
      }

      const { data, error } = await supabase
        .from("homepage_usps")
        .upsert(payload, { onConflict: "display_order" })
        .select("id, title, description, display_order")
        .single();

      if (error) {
        throw error;
      }

      const record = data as HomepageUspRecord;

      setUspItems((previous) =>
        previous.map((item) => {
          if (item.displayOrder !== record.display_order) {
            return item;
          }

          return {
            id: record.id,
            displayOrder: record.display_order,
            title: record.title ?? "",
            description: record.description ?? "",
          };
        }),
      );

      setUspError(null);

      await logUserAction({
        action: "homepage_usp_saved",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "homepage_usp",
        entityId: record.id,
        metadata: {
          displayOrder: record.display_order,
        },
      });

      alert("USP erfolgreich gespeichert!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Speichern des USP.";

      console.error("Fehler beim Speichern des USP:", message);
      setUspError("Der USP konnte nicht gespeichert werden.");
      alert(`Fehler beim Speichern: ${message}`);

      await logUserAction({
        action: "homepage_usp_save_failed",
        context: "admin",
        userId: currentUser?.id ?? null,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_usp",
        entityId: formItem.id,
        metadata: {
          displayOrder: formItem.displayOrder,
          error: message,
        },
      });
    } finally {
      setSavingUspDisplayOrder(null);
    }
  };

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>,
    type: HomepageImageType,
  ) => {
    event.preventDefault();

    const file = type === "background" ? backgroundFile : overlayFile;

    if (!file) {
      alert("Bitte wähle zuerst eine Datei aus.");
      return;
    }

    const setUploading =
      type === "background" ? setUploadingBackground : setUploadingOverlay;
    setUploading(true);

    let currentUser: { id: string; email?: string | null } | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          userError?.message ?? "Es konnte kein angemeldeter Nutzer ermittelt werden.",
        );
      }

      currentUser = { id: user.id, email: user.email };

      const fileExt = file.name.split(".").pop();
      const sanitizedType = type === "background" ? "background" : "overlay";
      const filePath = `${user.id}/${sanitizedType}-${Date.now()}.${
        fileExt ?? "png"
      }`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData?.path ?? filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Die öffentliche URL konnte nicht ermittelt werden.");
      }

      const { error: upsertError, data: upsertData } = await supabase
        .from("homepage_images")
        .upsert(
          {
            image_type: type,
            file_path: uploadData?.path ?? filePath,
            public_url: publicUrl,
          },
          { onConflict: "image_type" },
        )
        .select("image_type, public_url, file_path")
        .single();

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      if (type === "background") {
        setBackgroundImage(upsertData as HomepageImage);
        setBackgroundFile(null);
      } else {
        setOverlayImage(upsertData as HomepageImage);
        setOverlayFile(null);
      }

      event.currentTarget.reset();

      await logUserAction({
        action: "homepage_image_uploaded",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_image",
        entityId: type,
        metadata: {
          filePath: uploadData?.path ?? filePath,
          publicUrl,
        },
      });

      alert("Bild erfolgreich hochgeladen!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Hochladen.";
      console.error(message);
      alert(`Fehler beim Hochladen: ${message}`);
      await logUserAction({
        action: "homepage_image_upload_failed",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_image",
        entityId: type,
        metadata: {
          error: message,
        },
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (type: HomepageImageType) => {
    const image = type === "background" ? backgroundImage : overlayImage;

    if (!image?.file_path) {
      alert("Es wurde kein Bild zum Löschen gefunden.");
      return;
    }

    const setDeleting =
      type === "background" ? setDeletingBackground : setDeletingOverlay;
    setDeleting(true);

    let currentUser: { id: string; email?: string | null } | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          userError?.message ?? "Es konnte kein angemeldeter Nutzer ermittelt werden.",
        );
      }

      currentUser = { id: user.id, email: user.email };

      const { error: removeError } = await supabase.storage
        .from(bucketName)
        .remove([image.file_path]);

      if (
        removeError &&
        !(removeError.message?.toLowerCase().includes("not found"))
      ) {
        throw new Error(
          removeError.message ?? "Fehler beim Entfernen aus dem Storage.",
        );
      }

      const { error: deleteError } = await supabase
        .from("homepage_images")
        .delete()
        .eq("image_type", type);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (type === "background") {
        setBackgroundImage(null);
        setBackgroundFile(null);
      } else {
        setOverlayImage(null);
        setOverlayFile(null);
      }

      await logUserAction({
        action: "homepage_image_deleted",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_image",
        entityId: type,
        metadata: {
          filePath: image.file_path,
        },
      });

      alert("Bild erfolgreich gelöscht!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Löschen.";
      console.error(message);
      alert(`Fehler beim Löschen: ${message}`);
      await logUserAction({
        action: "homepage_image_delete_failed",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_image",
        entityId: type,
        metadata: {
          error: message,
          filePath: image.file_path,
        },
      });
    } finally {
      setDeleting(false);
    }
  };

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
        <h1>Homepage Verwaltung</h1>
        <p>Verwalte hier die Bilder der öffentlichen Startseite.</p>

        <section className="admin-card">
          <h2>Hero Hintergrundbild</h2>
          {backgroundImage?.public_url ? (
            <div className="admin-image-preview">
              <Image
                src={backgroundImage.public_url}
                alt="Aktueller Hintergrund"
                width={400}
                height={225}
                style={{ objectFit: "cover" }}
              />
              <p className="admin-image-path">{backgroundImage.file_path}</p>
              <button
                type="button"
                className="adminButton"
                onClick={() => handleDelete("background")}
                disabled={deletingBackground}
              >
                {deletingBackground ? "Lösche..." : "Bild löschen"}
              </button>
            </div>
          ) : (
            <p>Es ist noch kein Hintergrundbild hochgeladen.</p>
          )}

          <form
            onSubmit={(event) => handleUpload(event, "background")}
            className="admin-form"
          >
            <label className="admin-file-input">
              <span>Datei auswählen</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setBackgroundFile(event.target.files?.[0] ?? null)
                }
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

        <section className="admin-card">
          <h2>Hero Overlay</h2>
          <p>
            Bitte achte darauf, dass du dich selbst um die Form des Bildes kümmerst.
            Das Overlay sollte möglichst quadratisch sein und idealerweise eine
            Größe von 425&nbsp;px Breite und 550&nbsp;px Höhe besitzen.
          </p>
          {overlayImage?.public_url ? (
            <div className="admin-image-preview">
              <Image
                src={overlayImage.public_url}
                alt="Aktuelles Overlay"
                width={300}
                height={400}
                style={{ objectFit: "contain" }}
              />
              <p className="admin-image-path">{overlayImage.file_path}</p>
              <button
                type="button"
                className="adminButton"
                onClick={() => handleDelete("overlay")}
                disabled={deletingOverlay}
              >
                {deletingOverlay ? "Lösche..." : "Bild löschen"}
              </button>
            </div>
          ) : (
            <p>Es ist noch kein Overlay-Bild hochgeladen.</p>
          )}

          <form
            onSubmit={(event) => handleUpload(event, "overlay")}
            className="admin-form"
          >
            <label className="admin-file-input">
              <span>Datei auswählen</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setOverlayFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="submit"
              className="adminButton"
              disabled={uploadingOverlay}
            >
              {uploadingOverlay ? "Lade hoch..." : "Overlay speichern"}
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h2>USP-Punkte</h2>
          <p>
            Passe hier die drei Alleinstellungsmerkmale der Startseite an.
            Jeder Eintrag besteht aus einem Titel und einer kurzen
            Beschreibung.
          </p>

          {uspError ? <p>{uspError}</p> : null}

          {loadingUsps ? (
            <p>Lade USP-Punkte...</p>
          ) : (
            <div className="admin-usp-list">
              {uspItems.map((item) => (
                <form
                  key={item.displayOrder}
                  className="admin-form"
                  onSubmit={(event) => handleUspSubmit(event, item)}
                >
                  <div className="admin-form-field">
                    <label htmlFor={`usp-title-${item.displayOrder}`}>
                      Titel {item.displayOrder}
                    </label>
                    <input
                      id={`usp-title-${item.displayOrder}`}
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        handleUspFieldChange(
                          item.displayOrder,
                          "title",
                          event.target.value,
                        )
                      }
                      placeholder="Titel"
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor={`usp-description-${item.displayOrder}`}>
                      Beschreibung {item.displayOrder}
                    </label>
                    <textarea
                      id={`usp-description-${item.displayOrder}`}
                      value={item.description}
                      onChange={(event) =>
                        handleUspFieldChange(
                          item.displayOrder,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="Beschreibung"
                      rows={3}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="adminButton"
                    disabled={savingUspDisplayOrder === item.displayOrder}
                  >
                    {savingUspDisplayOrder === item.displayOrder
                      ? "Speichere..."
                      : "USP speichern"}
                  </button>
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
