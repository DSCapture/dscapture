"use client";

import { FormEvent, useEffect, useState } from "react";

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
