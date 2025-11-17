"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/toast/ToastProvider";
import { logUserAction } from "@/lib/logger";

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

export default function AdminHomepageUspsPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();
  const [uspItems, setUspItems] = useState<HomepageUspFormItem[]>([
    ...INITIAL_USP_ITEMS,
  ]);
  const [loadingUsps, setLoadingUsps] = useState(true);
  const [uspError, setUspError] = useState<string | null>(null);
  const [savingUspDisplayOrder, setSavingUspDisplayOrder] = useState<number | null>(
    null,
  );

  useEffect(() => {
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
      showToast({
        message: "Bitte fülle Titel und Beschreibung aus.",
        type: "error",
      });
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

      showToast({
        message: "USP erfolgreich gespeichert!",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Speichern des USP.";

      console.error("Fehler beim Speichern des USP:", message);
      setUspError("Der USP konnte nicht gespeichert werden.");
      showToast({
        message: `Fehler beim Speichern: ${message}`,
        type: "error",
      });

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
        <h1>Homepage USP-Punkte</h1>
        <p>
          Passe hier die drei Alleinstellungsmerkmale der Startseite an. Jeder
          Eintrag besteht aus einem Titel und einer kurzen Beschreibung.
        </p>

        <section className="admin-card">
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
