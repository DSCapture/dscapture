"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "./page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";

interface ReviewRecord {
  id: string;
  author: string | null;
  role: string | null;
  quote: string | null;
  rating: number | null;
  display_order: number | null;
}

interface ReviewFormState {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
  displayOrder: number;
}

type EditableReviewField = "author" | "role" | "quote" | "rating" | "displayOrder";

type NewReviewState = Omit<ReviewFormState, "id">;

const DEFAULT_NEW_REVIEW: NewReviewState = {
  author: "",
  role: "",
  quote: "",
  rating: 5,
  displayOrder: 1,
};

function clampRating(value: number) {
  if (Number.isNaN(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function normalizeReview(record: ReviewRecord): ReviewFormState {
  return {
    id: record.id,
    author: record.author?.trim() ?? "",
    role: record.role?.trim() ?? "",
    quote: record.quote?.trim() ?? "",
    rating: clampRating(record.rating ?? 5),
    displayOrder: record.display_order ?? 1,
  };
}

function sortReviews(reviews: ReviewFormState[]) {
  return [...reviews].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    return a.author.localeCompare(b.author);
  });
}

function computeNextDisplayOrder(reviews: ReviewFormState[]) {
  if (!reviews.length) {
    return 1;
  }

  const maxOrder = reviews.reduce(
    (max, review) => Math.max(max, review.displayOrder),
    reviews[0]?.displayOrder ?? 1,
  );

  return maxOrder + 1;
}

export default function AdminReviewsPage() {
  const { loading } = useVerifyAdminAccess();
  const [reviews, setReviews] = useState<ReviewFormState[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [creatingReview, setCreatingReview] = useState(false);
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState<NewReviewState>(DEFAULT_NEW_REVIEW);

  const nextDisplayOrder = useMemo(
    () => computeNextDisplayOrder(reviews),
    [reviews],
  );

  useEffect(() => {
    setNewReview((current) => ({
      ...current,
      displayOrder: nextDisplayOrder,
    }));
  }, [nextDisplayOrder]);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("homepage_reviews")
      .select("id, author, role, quote, rating, display_order")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der Rezensionen:", error);
      setFetchError("Die Rezensionen konnten nicht geladen werden.");
      setReviews([]);
      setLoadingReviews(false);
      return;
    }

    const normalized = sortReviews(
      (data ?? []).map((record) => normalizeReview(record as ReviewRecord)),
    );

    setReviews(normalized);
    setLoadingReviews(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      void loadReviews();
    }
  }, [loadReviews, loading]);

  const handleNewReviewFieldChange = useCallback(
    (field: EditableReviewField, value: string) => {
      setNewReview((current) => {
        if (field === "rating") {
          return {
            ...current,
            rating: clampRating(Number.parseInt(value, 10)),
          };
        }

        if (field === "displayOrder") {
          const parsed = Number.parseInt(value, 10);
          return {
            ...current,
            displayOrder: Number.isNaN(parsed) ? current.displayOrder : Math.max(1, parsed),
          };
        }

        return {
          ...current,
          [field]: value,
        };
      });
    },
    [],
  );

  const handleExistingReviewChange = useCallback(
    (id: string, field: EditableReviewField, value: string) => {
      setReviews((current) =>
        current.map((review) => {
          if (review.id !== id) {
            return review;
          }

          if (field === "rating") {
            return {
              ...review,
              rating: clampRating(Number.parseInt(value, 10)),
            };
          }

          if (field === "displayOrder") {
            const parsed = Number.parseInt(value, 10);
            return {
              ...review,
              displayOrder: Number.isNaN(parsed) ? review.displayOrder : Math.max(1, parsed),
            };
          }

          return {
            ...review,
            [field]: value,
          };
        }),
      );
    },
    [],
  );

  async function handleCreateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setActionError(null);
    setActionMessage(null);

    const trimmedAuthor = newReview.author.trim();
    const trimmedQuote = newReview.quote.trim();
    const trimmedRole = newReview.role.trim();

    if (!trimmedAuthor || !trimmedQuote) {
      setFormError("Bitte gib mindestens den Namen und das Zitat der Rezension an.");
      return;
    }

    setCreatingReview(true);

    const payload = {
      author: trimmedAuthor,
      role: trimmedRole ? trimmedRole : null,
      quote: trimmedQuote,
      rating: clampRating(newReview.rating),
      display_order: Math.max(1, newReview.displayOrder),
    };

    const { data: authData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("homepage_reviews")
      .insert(payload)
      .select("id, author, role, quote, rating, display_order")
      .single();

    if (error) {
      console.error("Fehler beim Anlegen der Rezension:", error);
      setFormError("Die Rezension konnte nicht angelegt werden. Bitte versuche es erneut.");
      await logUserAction({
        action: "homepage_review_create_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "homepage_review",
        entityId: null,
        metadata: {
          displayOrder: payload.display_order,
          rating: payload.rating,
          error: error.message,
        },
      });
      setCreatingReview(false);
      return;
    }

    const normalized = normalizeReview(data as ReviewRecord);

    setReviews((current) => sortReviews([...current, normalized]));
    setNewReview({ ...DEFAULT_NEW_REVIEW });
    setActionMessage("Die Rezension wurde angelegt.");

    await logUserAction({
      action: "homepage_review_created",
      context: "admin",
      userId: authData?.user?.id,
      userEmail: authData?.user?.email ?? null,
      entityType: "homepage_review",
      entityId: normalized.id,
      metadata: {
        displayOrder: normalized.displayOrder,
        rating: normalized.rating,
      },
    });

    setCreatingReview(false);
  }

  async function handleUpdateReview(id: string) {
    const review = reviews.find((entry) => entry.id === id);

    if (!review) {
      return;
    }

    const trimmedAuthor = review.author.trim();
    const trimmedQuote = review.quote.trim();
    const trimmedRole = review.role.trim();

    if (!trimmedAuthor || !trimmedQuote) {
      setActionError("Name und Zitat dürfen nicht leer sein.");
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setSavingReviewId(id);

    const payload = {
      author: trimmedAuthor,
      role: trimmedRole ? trimmedRole : null,
      quote: trimmedQuote,
      rating: clampRating(review.rating),
      display_order: Math.max(1, review.displayOrder),
    };

    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("homepage_reviews")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error(`Fehler beim Aktualisieren der Rezension ${id}:`, error);
      setActionError("Die Rezension konnte nicht aktualisiert werden. Bitte versuche es erneut.");
      await logUserAction({
        action: "homepage_review_update_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "homepage_review",
        entityId: id,
        metadata: {
          displayOrder: payload.display_order,
          rating: payload.rating,
          error: error.message,
        },
      });
      setSavingReviewId(null);
      return;
    }

    setReviews((current) =>
      sortReviews(
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                author: trimmedAuthor,
                role: trimmedRole,
                quote: trimmedQuote,
                rating: payload.rating,
                displayOrder: payload.display_order,
              }
            : entry,
        ),
      ),
    );

    setActionMessage("Die Rezension wurde aktualisiert.");

    await logUserAction({
      action: "homepage_review_updated",
      context: "admin",
      userId: authData?.user?.id,
      userEmail: authData?.user?.email ?? null,
      entityType: "homepage_review",
      entityId: id,
      metadata: {
        displayOrder: payload.display_order,
        rating: payload.rating,
      },
    });

    setSavingReviewId(null);
  }

  async function handleDeleteReview(id: string) {
    const review = reviews.find((entry) => entry.id === id);

    if (!review) {
      return;
    }

    const confirmed = window.confirm(
      `Soll die Rezension von "${review.author}" wirklich gelöscht werden?`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setDeletingReviewId(id);

    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("homepage_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Fehler beim Löschen der Rezension ${id}:`, error);
      setActionError("Die Rezension konnte nicht gelöscht werden. Bitte versuche es erneut.");
      await logUserAction({
        action: "homepage_review_delete_failed",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "homepage_review",
        entityId: id,
        metadata: {
          error: error.message,
        },
      });
      setDeletingReviewId(null);
      return;
    }

    setReviews((current) => current.filter((entry) => entry.id !== id));
    setActionMessage("Die Rezension wurde gelöscht.");

    await logUserAction({
      action: "homepage_review_deleted",
      context: "admin",
      userId: authData?.user?.id,
      userEmail: authData?.user?.email ?? null,
      entityType: "homepage_review",
      entityId: id,
      metadata: {
        rating: review.rating,
        displayOrder: review.displayOrder,
      },
    });

    setDeletingReviewId(null);
  }

  if (loading) {
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
        <div className={styles.reviewsContent}>
          <header className={styles.header}>
            <div>
              <h1>Rezensionen verwalten</h1>
              <p>
                Lege neue Kundenstimmen an, bearbeite bestehende Rezensionen und steuere die
                Reihenfolge für die Anzeige auf der Homepage.
              </p>
            </div>
          </header>

          {actionMessage ? <p className={styles.successMessage}>{actionMessage}</p> : null}
          {actionError ? <p className={styles.errorMessage}>{actionError}</p> : null}

          <section className={styles.sectionCard} aria-labelledby="create-review-heading">
            <div className={styles.sectionHeader}>
              <h2 id="create-review-heading">Neue Rezension anlegen</h2>
              <p>Alle Felder können jederzeit später angepasst werden.</p>
            </div>

            {formError ? <p className={styles.errorMessage}>{formError}</p> : null}

            <form className={styles.reviewForm} onSubmit={handleCreateReview}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="new-review-author">Name *</label>
                  <input
                    id="new-review-author"
                    type="text"
                    value={newReview.author}
                    onChange={(event) =>
                      handleNewReviewFieldChange("author", event.target.value)
                    }
                    placeholder="Name der Kundin oder des Kunden"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="new-review-role">Rolle / Unternehmen</label>
                  <input
                    id="new-review-role"
                    type="text"
                    value={newReview.role}
                    onChange={(event) =>
                      handleNewReviewFieldChange("role", event.target.value)
                    }
                    placeholder="z. B. CEO, Marketing Manager"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="new-review-rating">Bewertung (1-5)</label>
                  <input
                    id="new-review-rating"
                    type="number"
                    min={1}
                    max={5}
                    value={newReview.rating}
                    onChange={(event) =>
                      handleNewReviewFieldChange("rating", event.target.value)
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="new-review-display-order">Reihenfolge</label>
                  <input
                    id="new-review-display-order"
                    type="number"
                    min={1}
                    value={newReview.displayOrder}
                    onChange={(event) =>
                      handleNewReviewFieldChange("displayOrder", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="new-review-quote">Zitat *</label>
                <textarea
                  id="new-review-quote"
                  value={newReview.quote}
                  onChange={(event) =>
                    handleNewReviewFieldChange("quote", event.target.value)
                  }
                  placeholder="Was hat die Zusammenarbeit ausgezeichnet?"
                  rows={4}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={creatingReview}
                >
                  {creatingReview ? "Wird gespeichert…" : "Rezension anlegen"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.sectionCard} aria-labelledby="existing-reviews-heading">
            <div className={styles.sectionHeader}>
              <h2 id="existing-reviews-heading">Bestehende Rezensionen</h2>
              <p>Aktualisiere Inhalte oder passe die Reihenfolge der Anzeige an.</p>
            </div>

            {fetchError ? <p className={styles.errorMessage}>{fetchError}</p> : null}

            {loadingReviews ? (
              <p className={styles.infoMessage}>Rezensionen werden geladen…</p>
            ) : reviews.length === 0 ? (
              <p className={styles.infoMessage}>Es sind derzeit keine Rezensionen hinterlegt.</p>
            ) : (
              <ul className={styles.reviewList}>
                {reviews.map((review) => (
                  <li key={review.id} className={styles.reviewItem}>
                    <form
                      className={styles.reviewForm}
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleUpdateReview(review.id);
                      }}
                    >
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label htmlFor={`review-author-${review.id}`}>Name *</label>
                          <input
                            id={`review-author-${review.id}`}
                            type="text"
                            value={review.author}
                            onChange={(event) =>
                              handleExistingReviewChange(
                                review.id,
                                "author",
                                event.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className={styles.field}>
                          <label htmlFor={`review-role-${review.id}`}>
                            Rolle / Unternehmen
                          </label>
                          <input
                            id={`review-role-${review.id}`}
                            type="text"
                            value={review.role}
                            onChange={(event) =>
                              handleExistingReviewChange(
                                review.id,
                                "role",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label htmlFor={`review-rating-${review.id}`}>
                            Bewertung (1-5)
                          </label>
                          <input
                            id={`review-rating-${review.id}`}
                            type="number"
                            min={1}
                            max={5}
                            value={review.rating}
                            onChange={(event) =>
                              handleExistingReviewChange(
                                review.id,
                                "rating",
                                event.target.value,
                              )
                            }
                          />
                        </div>

                        <div className={styles.field}>
                          <label htmlFor={`review-order-${review.id}`}>
                            Reihenfolge
                          </label>
                          <input
                            id={`review-order-${review.id}`}
                            type="number"
                            min={1}
                            value={review.displayOrder}
                            onChange={(event) =>
                              handleExistingReviewChange(
                                review.id,
                                "displayOrder",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label htmlFor={`review-quote-${review.id}`}>Zitat *</label>
                        <textarea
                          id={`review-quote-${review.id}`}
                          value={review.quote}
                          onChange={(event) =>
                            handleExistingReviewChange(
                              review.id,
                              "quote",
                              event.target.value,
                            )
                          }
                          rows={4}
                          required
                        />
                      </div>

                      <div className={styles.formActions}>
                        <button
                          type="submit"
                          className={styles.primaryButton}
                          disabled={savingReviewId === review.id}
                        >
                          {savingReviewId === review.id
                            ? "Speichere…"
                            : "Änderungen speichern"}
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => void handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                        >
                          {deletingReviewId === review.id
                            ? "Lösche…"
                            : "Rezension löschen"}
                        </button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
