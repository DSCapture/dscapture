"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import styles from "./page.module.css";
import "../adminComponents/adminPageHader.css";

type ActivityLogContext = "public" | "admin" | "system";

type ActivityLogRow = {
  id: string;
  created_at: string;
  action: string;
  description: string | null;
  context: ActivityLogContext | null;
  user_id: string | null;
  user_email: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
};

type ActivityLog = ActivityLogRow & {
  metadataText: string;
};

const CONTEXT_LABELS: Record<ActivityLogContext, string> = {
  public: "Öffentlich",
  admin: "Admin",
  system: "System",
};

const CONTEXT_OPTIONS: { value: "all" | ActivityLogContext; label: string }[] = [
  { value: "all", label: "Alle Kontexte" },
  { value: "admin", label: CONTEXT_LABELS.admin },
  { value: "public", label: CONTEXT_LABELS.public },
  { value: "system", label: CONTEXT_LABELS.system },
];

export default function AdminLogsPage() {
  const { loading } = useVerifyAdminAccess();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<"all" | ActivityLogContext>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  const loadLogs = useCallback(async () => {
    setFetching(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("activity_logs")
      .select(
        "id, created_at, action, description, context, user_id, user_email, entity_type, entity_id, metadata"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Fehler beim Laden der Aktivitätslogs:", error);
      setFetchError("Die Log-Einträge konnten nicht geladen werden.");
      setLogs([]);
      setFetching(false);
      return;
    }

    const typedData = (data ?? []) as ActivityLogRow[];
    const enhanced = typedData.map<ActivityLog>((entry) => ({
      ...entry,
      metadataText: entry.metadata ? JSON.stringify(entry.metadata, null, 2) : "",
    }));

    setLogs(enhanced);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      void loadLogs();
    }
  }, [loadLogs, loading]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      if (contextFilter !== "all" && log.context !== contextFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        log.action,
        log.description ?? "",
        log.user_email ?? "",
        log.user_id ?? "",
        log.entity_type ?? "",
        log.entity_id ?? "",
        log.metadataText,
      ]
        .join("\n")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [contextFilter, logs, searchQuery]);

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className={`admin-content ${styles.logsContent}`}>
        <header className={`${styles.header} adminPageHeader`}>
          <div className={styles.headerText}>
            <h1>Aktivitätsprotokoll</h1>
            <p>
              Hier findest du die letzten Aktionen im System. Nutze die Filter, um gezielt nach
              bestimmten Ereignissen zu suchen.
            </p>
          </div>
          <button
            type="button"
            className={styles.reloadButton}
            onClick={() => {
              void loadLogs();
            }}
            disabled={fetching}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
            Aktualisieren
          </button>
        </header>

        <section className={styles.filters} aria-label="Filter für Aktivitätslogs">
          <div className={styles.filterGroup}>
            <label htmlFor="context-filter">Kontext</label>
            <select
              id="context-filter"
              className={styles.contextSelect}
              value={contextFilter}
              onChange={(event) => {
                setContextFilter(event.target.value as "all" | ActivityLogContext);
              }}
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.searchWrapper}>
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              type="search"
              placeholder="Nach Aktion, Beschreibung oder Nutzer suchen"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Aktivitätslogs durchsuchen"
            />
          </div>
        </section>

        <section className={styles.tableContainer} aria-live="polite">
          {fetching ? (
            <div className={styles.loadingState}>Log-Einträge werden geladen…</div>
          ) : fetchError ? (
            <div className={styles.errorState} role="alert">
              {fetchError}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className={styles.emptyState}>Keine Log-Einträge gefunden.</div>
          ) : (
            <table className={styles.logsTable}>
              <thead>
                <tr>
                  <th scope="col">Zeitpunkt</th>
                  <th scope="col">Aktion &amp; Beschreibung</th>
                  <th scope="col">Kontext</th>
                  <th scope="col">Nutzer</th>
                  <th scope="col">Entität</th>
                  <th scope="col">Metadaten</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className={styles.timestamp}>{dateFormatter.format(new Date(log.created_at))}</td>
                    <td>
                      <strong>{log.action}</strong>
                      {log.description ? <div>{log.description}</div> : null}
                    </td>
                    <td>
                      {log.context ? (
                        <span className={styles.contextBadge}>{CONTEXT_LABELS[log.context]}</span>
                      ) : (
                        <span className={styles.contextBadge}>-</span>
                      )}
                    </td>
                    <td>
                      {log.user_email ? (
                        <>
                          <div>{log.user_email}</div>
                          {log.user_id ? <div>ID: {log.user_id}</div> : null}
                        </>
                      ) : log.user_id ? (
                        <div>{log.user_id}</div>
                      ) : (
                        <div>-</div>
                      )}
                    </td>
                    <td>
                      {log.entity_type ? (
                        <>
                          <div>{log.entity_type}</div>
                          {log.entity_id ? <div>ID: {log.entity_id}</div> : null}
                        </>
                      ) : log.entity_id ? (
                        <div>{log.entity_id}</div>
                      ) : (
                        <div>-</div>
                      )}
                    </td>
                    <td>
                      {log.metadataText ? (
                        <pre className={styles.metadata}>{log.metadataText}</pre>
                      ) : (
                        <div>-</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
