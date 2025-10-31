"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import styles from "./page.module.css";
import "../adminComponents/adminPageHader.css";
import { supabase } from "@/lib/supabaseClient";

type ContactMessageStatus = "open" | "in_progress" | "done";

type ContactMessageRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactMessageStatus | null;
  created_at: string;
};

type ContactMessage = Omit<ContactMessageRow, "status"> & {
  status: ContactMessageStatus;
};

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

const STATUS_CLASSNAME: Record<ContactMessageStatus, string> = {
  open: styles.statusOpen,
  in_progress: styles.statusInProgress,
  done: styles.statusDone,
};

const STATUS_OPTIONS: { value: ContactMessageStatus; label: string }[] = [
  { value: "open", label: STATUS_LABELS.open },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "done", label: STATUS_LABELS.done },
];

function getMessagePreview(message: string, maxLength = 220) {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength).trimEnd()}…`;
}

export default function AdminContactPage() {
  const { loading } = useVerifyAdminAccess();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [updatingMessageId, setUpdatingMessageId] = useState<number | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const loadMessages = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setLoadingMessages(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("contact_messages")
      .select<ContactMessageRow>("id, name, email, phone, message, status, created_at")
      .order("created_at", { ascending: false });

    if (!isMountedRef.current) {
      return;
    }

    if (error) {
      console.error("Fehler beim Laden der Kontaktanfragen:", error);
      setFetchError("Die Kontaktanfragen konnten nicht geladen werden.");
      setMessages([]);
    } else {
      const normalizedMessages = (data ?? []).map<ContactMessage>((message) => ({
        ...message,
        status: (message.status ?? "open") as ContactMessageStatus,
      }));
      setMessages(normalizedMessages);
    }

    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      loadMessages();
    }
  }, [loadMessages, loading]);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedMessages((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (id: number, nextStatus: ContactMessageStatus) => {
      const message = messages.find((entry) => entry.id === id);

      if (!message) {
        return;
      }

      const previousStatus = message.status;

      setStatusUpdateError(null);
      setUpdatingMessageId(id);
      setMessages((current) =>
        current.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: nextStatus,
              }
            : entry,
        ),
      );

      const { error } = await supabase
        .from("contact_messages")
        .update({ status: nextStatus })
        .eq("id", id);

      if (!isMountedRef.current) {
        return;
      }

      if (error) {
        console.error(`Fehler beim Aktualisieren des Status für Nachricht ${id}:`, error);
        setStatusUpdateError("Der Status konnte nicht aktualisiert werden. Bitte versuche es erneut.");
        setMessages((current) =>
          current.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: previousStatus,
                }
              : entry,
          ),
        );
      }

      setUpdatingMessageId(null);
    },
    [messages],
  );

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
      <div className={`admin-content ${styles.contactContent}`}>
        <header className={`adminPageHeader ${styles.header}`}>
          <div>
            <h1>Kontaktanfragen</h1>
            <p>Verwalte eingehende Nachrichten und behalte den Bearbeitungsstatus im Blick.</p>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.reloadButton}
              type="button"
              onClick={loadMessages}
              disabled={loadingMessages}
            >
              <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
              Aktualisieren
            </button>
          </div>
        </header>

        {statusUpdateError && <div className={styles.errorMessage}>{statusUpdateError}</div>}
        {fetchError && <div className={styles.errorMessage}>{fetchError}</div>}

        {loadingMessages && !fetchError ? (
          <p>Kontaktanfragen werden geladen...</p>
        ) : null}

        {!loadingMessages && !fetchError && messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Es sind derzeit keine Kontaktanfragen vorhanden.</p>
          </div>
        ) : null}

        {!loadingMessages && !fetchError && messages.length > 0 ? (
          <ul className={styles.messageList}>
            {messages.map((message) => {
              const isExpanded = expandedMessages.has(message.id);
              const preview = getMessagePreview(message.message);
              const badgeClassName = `${styles.statusBadge} ${STATUS_CLASSNAME[message.status]}`;

              return (
                <li key={message.id} className={styles.messageCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h2>{message.name}</h2>
                      <span>Eingegangen am {dateFormatter.format(new Date(message.created_at))}</span>
                    </div>

                    <div className={styles.statusControl}>
                      <span className={badgeClassName}>{STATUS_LABELS[message.status]}</span>
                      <label htmlFor={`status-${message.id}`}>Status festlegen</label>
                      <select
                        id={`status-${message.id}`}
                        value={message.status}
                        onChange={(event) =>
                          handleStatusChange(message.id, event.target.value as ContactMessageStatus)
                        }
                        disabled={updatingMessageId === message.id}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.metaInfo}>
                    <span>
                      <strong>E-Mail:</strong>{" "}
                      <a href={`mailto:${message.email}`}>{message.email}</a>
                    </span>
                    <span>
                      <strong>Telefon:</strong> {message.phone?.trim() ? message.phone : "Nicht angegeben"}
                    </span>
                  </div>

                  <div className={styles.messageBody}>
                    <p className={styles.messageText}>{isExpanded ? message.message : preview}</p>
                    {message.message.length > preview.length && (
                      <button
                        type="button"
                        className={styles.toggleButton}
                        onClick={() => toggleExpanded(message.id)}
                      >
                        {isExpanded ? "Weniger anzeigen" : "Komplette Nachricht lesen"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
