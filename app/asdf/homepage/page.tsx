"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import { useToast } from "@/components/toast/ToastProvider";

type HomepageImageType = "background" | "overlay";

const bucketName = "homepage-assets";

interface HomepageImage {
  image_type: HomepageImageType;
  public_url: string;
  file_path: string;
}

export default function AdminHomepagePage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();
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

    fetchImages();
  }, []);

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>,
    type: HomepageImageType,
  ) => {
    event.preventDefault();

    const file = type === "background" ? backgroundFile : overlayFile;

    if (!file) {
      showToast({
        message: "Bitte wähle zuerst eine Datei aus.",
        type: "error",
      });
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

      showToast({
        message: "Bild erfolgreich hochgeladen!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Hochladen.";
      console.error(message);
      showToast({
        message: `Fehler beim Hochladen: ${message}`,
        type: "error",
      });
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
      showToast({
        message: "Es wurde kein Bild zum Löschen gefunden.",
        type: "error",
      });
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

      showToast({
        message: "Bild erfolgreich gelöscht!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Löschen.";
      console.error(message);
      showToast({
        message: `Fehler beim Löschen: ${message}`,
        type: "error",
      });
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
      </div>
    </div>
  );
}
