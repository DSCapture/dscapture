"use client";

import { FormEvent, useEffect, useState } from "react";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "./page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";

interface PhotographerIntroFormState {
  heading: string;
  subheading: string;
  body: string;
}

const DEFAULT_FORM_STATE: PhotographerIntroFormState = {
  heading: "",
  subheading: "",
  body: "",
};

export default function AdminPhotographerIntroPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const [recordId, setRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PhotographerIntroFormState>(DEFAULT_FORM_STATE);
  const [loadingIntro, setLoadingIntro] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (verifying) {
      return;
    }

    const fetchIntro = async () => {
      setLoadingIntro(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from("homepage_photographer_intro")
        .select("id, heading, subheading, body")
        .maybeSingle();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Fehler beim Laden der Fotografen-Vorstellung:", error.message);
          setFetchError("Die Vorstellung konnte nicht geladen werden. Bitte versuche es erneut.");
        }
        setRecordId(null);
        setFormState(DEFAULT_FORM_STATE);
        setLoadingIntro(false);
        return;
      }

      if (data) {
        const normalized: PhotographerIntroFormState = {
          heading: data.heading?.trim() ?? "",
          subheading: data.subheading?.trim() ?? "",
          body: data.body?.trim() ?? "",
        };

        setRecordId(data.id);
        setFormState(normalized);
      } else {
        setRecordId(null);
        setFormState(DEFAULT_FORM_STATE);
      }

      setLoadingIntro(false);
    };

    void fetchIntro();
  }, [verifying]);

  const handleFieldChange = (field: keyof PhotographerIntroFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    const trimmedHeading = formState.heading.trim();
    const trimmedBody = formState.body.trim();
    const trimmedSubheading = formState.subheading.trim();

    if (!trimmedHeading || !trimmedBody) {
      setFormError("Bitte gib mindestens eine Überschrift und den Vorstellungstext an.");
      return;
    }

    setSaving(true);

    const payload: {
      singleton_key: string;
      heading: string;
      subheading: string | null;
      body: string;
      id?: string;
    } = {
      singleton_key: "homepage",
      heading: trimmedHeading,
      subheading: trimmedSubheading.length > 0 ? trimmedSubheading : null,
      body: trimmedBody,
    };

    if (recordId) {
      payload.id = recordId;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("homepage_photographer_intro")
        .upsert(payload, { onConflict: "singleton_key" })
        .select("id, heading, subheading, body")
        .single();

      if (error) {
        throw error;
      }

      setRecordId(data.id);
      setFormState({
        heading: data.heading?.trim() ?? "",
        subheading: data.subheading?.trim() ?? "",
        body: data.body?.trim() ?? "",
      });
      setStatusMessage("Die Vorstellung wurde gespeichert.");

      await logUserAction({
        action: "homepage_photographer_intro_saved",
        context: "admin",
        userId: user?.id,
        userEmail: user?.email ?? null,
        entityType: "homepage_photographer_intro",
        entityId: data.id,
        metadata: {
          hasSubheading: Boolean(data.subheading?.trim()),
          bodyLength: data.body?.length ?? 0,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Die Vorstellung konnte nicht gespeichert werden.";
      console.error("Fehler beim Speichern der Vorstellung:", message);
      setFormError("Die Vorstellung konnte nicht gespeichert werden. Bitte versuche es erneut.");

      const { data: authData } = await supabase.auth.getUser();
      await logUserAction({
        action: "homepage_photographer_intro_save_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "homepage_photographer_intro",
        entityId: recordId,
        metadata: {
          error: message,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-content">
        <div className={styles.pageContent}>
          <header className={styles.header}>
            <h1>Fotografen-Vorstellung</h1>
            <p>
              Verwalte die Einführung des Fotografen, die zwischen den USP-Highlights und den
              Kundenstimmen auf der Homepage angezeigt wird.
            </p>
          </header>

          <section className={styles.formCard} aria-busy={loadingIntro} aria-live="polite">
            <div className={styles.formHeader}>
              <h2>Inhalt bearbeiten</h2>
              <p>Die Inhalte werden in Echtzeit auf der Homepage übernommen.</p>
            </div>

            {fetchError ? <p className={styles.errorMessage}>{fetchError}</p> : null}
            {formError ? <p className={styles.errorMessage}>{formError}</p> : null}
            {statusMessage ? <p className={styles.statusMessage}>{statusMessage}</p> : null}

            <form onSubmit={handleSubmit} className={styles.formFields}>
              <div className={styles.field}>
                <label htmlFor="intro-heading">Überschrift</label>
                <input
                  id="intro-heading"
                  name="heading"
                  type="text"
                  placeholder="z. B. Der Fotograf hinter DS_Capture"
                  value={formState.heading}
                  onChange={(event) => handleFieldChange("heading", event.target.value)}
                  disabled={loadingIntro || saving}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="intro-subheading">Unterzeile (optional)</label>
                <input
                  id="intro-subheading"
                  name="subheading"
                  type="text"
                  placeholder="Kurze Ergänzung zur Überschrift"
                  value={formState.subheading}
                  onChange={(event) => handleFieldChange("subheading", event.target.value)}
                  disabled={loadingIntro || saving}
                />
                <p className={styles.helperText}>
                  Wird oberhalb des Vorstellungstextes angezeigt. Lasse das Feld leer, wenn keine
                  Unterzeile benötigt wird.
                </p>
              </div>

              <div className={styles.field}>
                <label htmlFor="intro-body">Vorstellungstext</label>
                <textarea
                  id="intro-body"
                  name="body"
                  placeholder={
                    "Beschreibe den fotografischen Hintergrund, Arbeitsweise und Mehrwert für Kund:innen."
                  }
                  value={formState.body}
                  onChange={(event) => handleFieldChange("body", event.target.value)}
                  disabled={loadingIntro || saving}
                  required
                />
                <p className={styles.helperText}>
                  Absätze können durch eine Leerzeile getrennt werden.
                </p>
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={saving || loadingIntro}
                >
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
