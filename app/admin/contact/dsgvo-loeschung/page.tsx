"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import styles from "./page.module.css";
import "../../adminComponents/adminPageHader.css";

type ArchivedContactMessage = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
};

export default function GdprDeletionPage() {
  const { loading } = useVerifyAdminAccess();
  const [messages, setMessages] = useState<ArchivedContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const cutoffDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date;
  }, []);

  const cutoffIsoString = useMemo(() => cutoffDate.toISOString(), [cutoffDate]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, phone, message, created_at")
      .lte("created_at", cutoffIsoString)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der alten Kontaktanfragen:", error);
      setFetchError("Die alten Kontaktanfragen konnten nicht geladen werden.");
      setMessages([]);
    } else {
      setMessages((data ?? []) as ArchivedContactMessage[]);
    }

    setLoadingMessages(false);
  }, [cutoffIsoString]);

  useEffect(() => {
    if (!loading) {
      loadMessages();
    }
  }, [loadMessages, loading]);

  const handleDeleteMessage = useCallback(
    async (id: number) => {
      setDeleteError(null);
      setDeletingMessageId(id);

      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);

      setDeletingMessageId(null);

      if (error) {
        console.error(`Fehler beim Löschen der Nachricht ${id}:`, error);
        setDeleteError("Die Nachricht konnte nicht gelöscht werden. Bitte versuche es erneut.");
        return;
      }

      setMessages((current) => current.filter((message) => message.id !== id));

      await logUserAction({
        action: "contact_message_deleted_gdpr",
        context: "admin",
        userId: authData?.user?.id,
        userEmail: authData?.user?.email ?? null,
        entityType: "contact_message",
        entityId: id,
        metadata: { reason: "gdpr_cleanup" },
      });
    },
    [],
  );

  const handleDeleteAll = useCallback(async () => {
    if (!messages.length) {
      return;
    }

    setDeleteError(null);
    setIsDeletingAll(true);

    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .lte("created_at", cutoffIsoString)
      .select("id");

    setIsDeletingAll(false);

    if (error) {
      console.error("Fehler beim Löschen der alten Kontaktanfragen:", error);
      setDeleteError("Die Nachrichten konnten nicht gelöscht werden. Bitte versuche es erneut.");
      return;
    }

    setMessages([]);

    await logUserAction({
      action: "contact_messages_bulk_deleted_gdpr",
      context: "admin",
      userId: authData?.user?.id,
      userEmail: authData?.user?.email ?? null,
      entityType: "contact_message",
      entityId: null,
      metadata: {
        reason: "gdpr_cleanup",
        cutoffDate: cutoffIsoString,
        deletedIds: (data ?? []).map((entry) => entry.id),
      },
    });
  }, [cutoffIsoString, messages.length]);

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
      <div className={`admin-content ${styles.gdprContent}`}>
        <header className={`adminPageHeader ${styles.header}`}>
          <div>
            <h1>DSGVO-Löschung</h1>
            <p>
              Hier findest du alle Kontaktanfragen, die älter als zwölf Monate sind (bis einschließlich
              {" "}
              {dateFormatter.format(cutoffDate)}). Lösche einzelne Nachrichten oder entferne alle veralteten
              Einträge auf einmal.
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.deleteAllButton}
              onClick={handleDeleteAll}
              disabled={isDeletingAll || messages.length === 0}
            >
              <i className="bi bi-shield-x" aria-hidden="true"></i>
              Alle älteren Nachrichten löschen
            </button>
          </div>
        </header>

        <div className={styles.infoBox}>
          <i className="bi bi-info-circle" aria-hidden="true"></i>
          <div>
            <strong>Hinweis zur DSGVO:</strong>
            <p>
              Diese Liste zeigt nur Nachrichten, die das Aufbewahrungsfenster von zwölf Monaten überschritten
              haben. Gelöschte Nachrichten können nicht wiederhergestellt werden.
            </p>
          </div>
        </div>

        {deleteError && <div className={styles.errorMessage}>{deleteError}</div>}
        {fetchError && <div className={styles.errorMessage}>{fetchError}</div>}

        <div className={styles.statsBar}>
          <span>
            <i className="bi bi-archive" aria-hidden="true"></i>
            {messages.length} Nachrichten bereit zur Löschung
          </span>
          <span>
            <i className="bi bi-calendar-check" aria-hidden="true"></i>
            Stichtag: {dateFormatter.format(cutoffDate)}
          </span>
        </div>

        {loadingMessages ? <p className={styles.loadingState}>Nachrichten werden geladen…</p> : null}

        {!loadingMessages && !fetchError && messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aktuell gibt es keine Kontaktanfragen, die älter als zwölf Monate sind.</p>
          </div>
        ) : null}

        {!loadingMessages && !fetchError && messages.length > 0 ? (
          <ul className={styles.messageList}>
            {messages.map((message) => (
              <li key={message.id} className={styles.messageCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h2>{message.name}</h2>
                    <a href={`mailto:${message.email}`}>{message.email}</a>
                  </div>
                  <div className={styles.cardMeta}>
                    <span>
                      <i className="bi bi-calendar" aria-hidden="true"></i> Eingang am
                    </span>
                    <time dateTime={message.created_at}>
                      {dateFormatter.format(new Date(message.created_at))}
                    </time>
                  </div>
                </div>

                <div className={styles.details}>
                  <span>
                    <i className="bi bi-telephone" aria-hidden="true"></i>{" "}
                    {message.phone ? message.phone : "Keine Telefonnummer"}
                  </span>
                  <span>
                    <i className="bi bi-hash" aria-hidden="true"></i> ID: {message.id}
                  </span>
                </div>

                <p className={styles.messageBody}>{message.message}</p>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDeleteMessage(message.id)}
                    disabled={deletingMessageId === message.id || isDeletingAll}
                  >
                    <i className="bi bi-trash" aria-hidden="true"></i>
                    Nachricht löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
