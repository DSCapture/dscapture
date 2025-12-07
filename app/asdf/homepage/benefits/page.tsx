"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";

import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import styles from "./page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/toast/ToastProvider";
import { logUserAction } from "@/lib/logger";

type HomepageBenefitRecord = {
  id: string;
  title: string;
  description: string;
  display_order: number;
};

type BenefitBackgroundRecord = {
  id: string;
  singleton_key: string;
  public_url: string;
  file_path: string;
};

type HomepageBenefitFormItem = {
  id: string | null;
  displayOrder: number;
  title: string;
  description: string;
};

const INITIAL_BENEFITS: HomepageBenefitFormItem[] = [
  { id: null, displayOrder: 1, title: "", description: "" },
  { id: null, displayOrder: 2, title: "", description: "" },
  { id: null, displayOrder: 3, title: "", description: "" },
];

const BENEFIT_BACKGROUND_BUCKET = "homepage-benefits";
const BENEFIT_BACKGROUND_SINGLETON_KEY = "benefits";

export default function AdminHomepageBenefitsPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();
  const [benefitItems, setBenefitItems] = useState<HomepageBenefitFormItem[]>([
    ...INITIAL_BENEFITS,
  ]);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [benefitsError, setBenefitsError] = useState<string | null>(null);
  const [savingBenefitDisplayOrder, setSavingBenefitDisplayOrder] = useState<
    number | null
  >(null);
  const [benefitBackground, setBenefitBackground] =
    useState<BenefitBackgroundRecord | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState(false);

  useEffect(() => {
    if (verifying) {
      return;
    }

    const fetchBenefits = async () => {
      setLoadingBenefits(true);

      try {
        const { data, error } = await supabase
          .from("homepage_benefits")
          .select("id, title, description, display_order")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }

        const byOrder = new Map<number, HomepageBenefitRecord>();
        data?.forEach((record) => {
          if (typeof record.display_order === "number") {
            byOrder.set(record.display_order, record as HomepageBenefitRecord);
          }
        });

        setBenefitItems((previous) =>
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
            } satisfies HomepageBenefitFormItem;
          }),
        );

        setBenefitsError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Laden der Benefits.";
        console.error("Fehler beim Laden der Benefits:", message);
        setBenefitsError("Die Benefits konnten nicht geladen werden.");
      } finally {
        setLoadingBenefits(false);
      }
    };

    void fetchBenefits();
    const fetchBenefitBackground = async () => {
      try {
        const { data, error } = await supabase
          .from("homepage_benefit_backgrounds")
          .select("id, singleton_key, public_url, file_path")
          .eq("singleton_key", BENEFIT_BACKGROUND_SINGLETON_KEY)
          .maybeSingle();

        if (error) {
          if (error.code !== "PGRST116") {
            throw error;
          }
          return;
        }

        if (data) {
          setBenefitBackground(data as BenefitBackgroundRecord);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Laden des Benefit-Hintergrunds.";
        console.error("Fehler beim Laden des Benefit-Hintergrunds:", message);
      }
    };

    void fetchBenefitBackground();
  }, [verifying]);

  const handleFieldChange = (
    displayOrder: number,
    field: "title" | "description",
    value: string,
  ) => {
    setBenefitItems((previous) =>
      previous.map((item) => {
        if (item.displayOrder !== displayOrder) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        } satisfies HomepageBenefitFormItem;
      }),
    );
  };

  const handleBackgroundUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!backgroundFile) {
      showToast({
        message: "Bitte wähle zuerst eine Datei aus.",
        type: "error",
      });
      return;
    }

    setUploadingBackground(true);

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

      const fileExt = backgroundFile.name.split(".").pop() ?? "png";
      const filePath = `${user.id}/benefits-background-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BENEFIT_BACKGROUND_BUCKET)
        .upload(filePath, backgroundFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from(BENEFIT_BACKGROUND_BUCKET)
        .getPublicUrl(uploadData?.path ?? filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Die öffentliche URL konnte nicht ermittelt werden.");
      }

      const { data, error: upsertError } = await supabase
        .from("homepage_benefit_backgrounds")
        .upsert(
          {
            singleton_key: BENEFIT_BACKGROUND_SINGLETON_KEY,
            file_path: uploadData?.path ?? filePath,
            public_url: publicUrl,
          },
          { onConflict: "singleton_key" },
        )
        .select("id, singleton_key, public_url, file_path")
        .single();

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      setBenefitBackground(data as BenefitBackgroundRecord);
      setBackgroundFile(null);
      event.currentTarget.reset();

      await logUserAction({
        action: "homepage_benefit_background_saved",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "homepage_benefit_background",
        entityId: data.id,
        metadata: {
          filePath: uploadData?.path ?? filePath,
          publicUrl,
        },
      });

      showToast({
        message: "Hintergrundbild erfolgreich gespeichert!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Hochladen des Hintergrundbilds.";

      console.error("Fehler beim Speichern des Backgrounds:", message);
      showToast({
        message: `Fehler beim Hochladen: ${message}`,
        type: "error",
      });

      await logUserAction({
        action: "homepage_benefit_background_save_failed",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_benefit_background",
        entityId: BENEFIT_BACKGROUND_SINGLETON_KEY,
        metadata: { error: message },
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleBackgroundDelete = async () => {
    if (!benefitBackground?.file_path) {
      showToast({
        message: "Es wurde kein Bild zum Löschen gefunden.",
        type: "error",
      });
      return;
    }

    setDeletingBackground(true);

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
        .from(BENEFIT_BACKGROUND_BUCKET)
        .remove([benefitBackground.file_path]);

      if (removeError && !removeError.message?.toLowerCase().includes("not found")) {
        throw new Error(removeError.message);
      }

      const { error: deleteError } = await supabase
        .from("homepage_benefit_backgrounds")
        .delete()
        .eq("singleton_key", BENEFIT_BACKGROUND_SINGLETON_KEY);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setBenefitBackground(null);
      setBackgroundFile(null);

      await logUserAction({
        action: "homepage_benefit_background_deleted",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "homepage_benefit_background",
        entityId: BENEFIT_BACKGROUND_SINGLETON_KEY,
        metadata: {
          filePath: benefitBackground.file_path,
        },
      });

      showToast({
        message: "Hintergrundbild erfolgreich gelöscht!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Löschen des Hintergrundbilds.";

      console.error("Fehler beim Löschen des Backgrounds:", message);
      showToast({
        message: `Fehler beim Löschen: ${message}`,
        type: "error",
      });

      await logUserAction({
        action: "homepage_benefit_background_delete_failed",
        context: "admin",
        userId: currentUser?.id,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_benefit_background",
        entityId: BENEFIT_BACKGROUND_SINGLETON_KEY,
        metadata: {
          error: message,
          filePath: benefitBackground.file_path,
        },
      });
    } finally {
      setDeletingBackground(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    formItem: HomepageBenefitFormItem,
  ) => {
    event.preventDefault();

    const trimmedTitle = formItem.title.trim();
    const trimmedDescription = formItem.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      showToast({
        message: "Bitte fülle Titel und Beschreibung aus.",
        type: "error",
      });
      return;
    }

    setSavingBenefitDisplayOrder(formItem.displayOrder);

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
        .from("homepage_benefits")
        .upsert(payload, { onConflict: "display_order" })
        .select("id, title, description, display_order")
        .single();

      if (error) {
        throw error;
      }

      const record = data as HomepageBenefitRecord;

      setBenefitItems((previous) =>
        previous.map((item) => {
          if (item.displayOrder !== record.display_order) {
            return item;
          }

          return {
            id: record.id,
            displayOrder: record.display_order,
            title: record.title ?? "",
            description: record.description ?? "",
          } satisfies HomepageBenefitFormItem;
        }),
      );

      setBenefitsError(null);

      await logUserAction({
        action: "homepage_benefit_saved",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "homepage_benefit",
        entityId: record.id,
        metadata: {
          displayOrder: record.display_order,
        },
      });

      showToast({
        message: "Benefit erfolgreich gespeichert!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Speichern des Benefits.";

      console.error("Fehler beim Speichern des Benefits:", message);
      setBenefitsError("Der Benefit konnte nicht gespeichert werden.");
      showToast({
        message: `Fehler beim Speichern: ${message}`,
        type: "error",
      });

      await logUserAction({
        action: "homepage_benefit_save_failed",
        context: "admin",
        userId: currentUser?.id ?? null,
        userEmail: currentUser?.email ?? null,
        entityType: "homepage_benefit",
        entityId: formItem.id,
        metadata: {
          displayOrder: formItem.displayOrder,
          error: message,
        },
      });
    } finally {
      setSavingBenefitDisplayOrder(null);
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
      <div className={`admin-content ${styles.benefitsContent}`}>
        <header className={styles.header}>
          <h1>Homepage Benefits</h1>
          <p>
            Verwalte hier die drei Benefits, die auf der Startseite nach den Rezensionen
            angezeigt werden. Jeder Benefit besteht aus einem Titel und einer
            ausführlicheren Beschreibung.
          </p>
        </header>

        <section className="admin-card">
          <div className={styles.sectionHeader}>
            <h2>Benefit Hintergrundbild</h2>
            <p>
              Steuert das Hintergrundbild der Benefit-Sektion auf der Homepage. Ideale
              Abmessungen sind mindestens 1600&nbsp;px Breite bei moderater Höhe.
            </p>
          </div>

          {benefitBackground?.public_url ? (
            <div className="admin-image-preview">
              <Image
                src={benefitBackground.public_url}
                alt="Aktueller Benefit-Hintergrund"
                width={520}
                height={260}
                style={{ objectFit: "cover", borderRadius: "12px" }}
              />
              <p className="admin-image-path">{benefitBackground.file_path}</p>
              <button
                type="button"
                className="adminButton"
                onClick={handleBackgroundDelete}
                disabled={deletingBackground}
              >
                {deletingBackground ? "Lösche..." : "Bild löschen"}
              </button>
            </div>
          ) : (
            <p>Es ist noch kein Hintergrundbild hochgeladen.</p>
          )}

          <form onSubmit={handleBackgroundUpload} className="admin-form">
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

        <section className="admin-card">
          <div className={styles.sectionHeader}>
            <h2>Benefits anpassen</h2>
            <p>
              Änderungen werden sofort auf der Homepage sichtbar, sobald sie gespeichert
              wurden.
            </p>
          </div>

          {benefitsError ? (
            <p className={styles.errorMessage}>{benefitsError}</p>
          ) : null}

          {loadingBenefits ? (
            <p>Lade Benefits...</p>
          ) : (
            <div className={styles.benefitList}>
              {benefitItems.map((item) => (
                <form
                  key={item.displayOrder}
                  className="admin-form"
                  onSubmit={(event) => handleSubmit(event, item)}
                >
                  <div className="admin-form-field">
                    <label htmlFor={`benefit-title-${item.displayOrder}`}>
                      Titel {item.displayOrder}
                    </label>
                    <input
                      id={`benefit-title-${item.displayOrder}`}
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        handleFieldChange(
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
                    <label htmlFor={`benefit-description-${item.displayOrder}`}>
                      Beschreibung {item.displayOrder}
                    </label>
                    <textarea
                      id={`benefit-description-${item.displayOrder}`}
                      value={item.description}
                      onChange={(event) =>
                        handleFieldChange(
                          item.displayOrder,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="Beschreibung"
                      rows={4}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="adminButton"
                    disabled={savingBenefitDisplayOrder === item.displayOrder}
                  >
                    {savingBenefitDisplayOrder === item.displayOrder
                      ? "Speichere..."
                      : "Benefit speichern"}
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
