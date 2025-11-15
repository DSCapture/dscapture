"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/toast/ToastProvider";
import { logUserAction } from "@/lib/logger";
import styles from "./page.module.css";

type ServicePortfolioAssignment = {
  id: string;
  project_id: string;
  display_order: number;
};

type ServiceRecord = {
  id: string;
  slug: string;
  label: string;
  headline: string;
  subline: string;
  info_title: string | null;
  info_paragraphs: string[] | null;
  info_bullet_points: string[] | null;
  gradient_start: string | null;
  gradient_end: string | null;
  image_path: string | null;
  service_portfolio_projects: ServicePortfolioAssignment[] | null;
};

type PortfolioProject = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string | null;
};

type ProjectSelection = {
  projectId: string;
  displayOrder: number;
};

type ServiceFormState = {
  label: string;
  headline: string;
  subline: string;
  infoTitle: string;
  infoParagraphs: string;
  infoBulletPoints: string;
  gradientStart: string;
  gradientEnd: string;
  imagePath: string;
  selectedProjects: ProjectSelection[];
};

const emptyForm: ServiceFormState = {
  label: "",
  headline: "",
  subline: "",
  infoTitle: "",
  infoParagraphs: "",
  infoBulletPoints: "",
  gradientStart: "",
  gradientEnd: "",
  imagePath: "",
  selectedProjects: [],
};

const normalizeMultiline = (value: string[]) => value.join("\n");

const parseMultilineInput = (input: string) =>
  input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

function mapServiceToForm(service: ServiceRecord): ServiceFormState {
  return {
    label: service.label ?? "",
    headline: service.headline ?? "",
    subline: service.subline ?? "",
    infoTitle: service.info_title ?? "",
    infoParagraphs: normalizeMultiline(service.info_paragraphs ?? []),
    infoBulletPoints: normalizeMultiline(service.info_bullet_points ?? []),
    gradientStart: service.gradient_start ?? "",
    gradientEnd: service.gradient_end ?? "",
    imagePath: service.image_path ?? "",
    selectedProjects: (service.service_portfolio_projects ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((assignment) => ({
        projectId: assignment.project_id,
        displayOrder: assignment.display_order,
      })),
  } satisfies ServiceFormState;
}

export default function AdminServicesPage() {
  const { loading: verifying } = useVerifyAdminAccess();
  const { showToast } = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [serviceForms, setServiceForms] = useState<Record<string, ServiceFormState>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [{ data: serviceData, error: serviceError }, { data: projectData, error: projectError }] =
      await Promise.all([
        supabase
          .from<ServiceRecord>("services")
          .select(
            `id, slug, label, headline, subline, info_title, info_paragraphs, info_bullet_points, gradient_start, gradient_end, image_path,
            service_portfolio_projects (
              id,
              project_id,
              display_order
            )`
          )
          .order("created_at", { ascending: true }),
        supabase
          .from<PortfolioProject>("portfolio_projects")
          .select("id, title, subtitle, slug")
          .order("title", { ascending: true }),
      ]);

    if (serviceError) {
      console.error("Fehler beim Laden der Services:", serviceError);
      showToast({
        title: "Fehler",
        message: "Services konnten nicht geladen werden.",
        type: "error",
      });
    }

    if (projectError) {
      console.error("Fehler beim Laden der Portfolio-Projekte:", projectError);
      showToast({
        title: "Fehler",
        message: "Portfolio-Projekte konnten nicht geladen werden.",
        type: "error",
      });
    }

    const resolvedServices = serviceData ?? [];
    setServices(resolvedServices);
    setProjects(projectData ?? []);
    setServiceForms(() => {
      const forms: Record<string, ServiceFormState> = {};
      resolvedServices.forEach((service) => {
        forms[service.slug] = mapServiceToForm(service);
      });
      return forms;
    });

    setLoadingData(false);
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleInputChange = useCallback(
    (slug: string, field: keyof ServiceFormState, value: string) => {
      setServiceForms((prev) => ({
        ...prev,
        [slug]: {
          ...(prev[slug] ?? emptyForm),
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleToggleProject = useCallback((slug: string, projectId: string, enabled: boolean) => {
    setServiceForms((prev) => {
      const current = prev[slug] ?? { ...emptyForm };
      const existingSelections = current.selectedProjects ?? [];

      let nextSelections: ProjectSelection[];

      if (enabled) {
        if (existingSelections.some((item) => item.projectId === projectId)) {
          return prev;
        }

        nextSelections = [
          ...existingSelections,
          { projectId, displayOrder: existingSelections.length },
        ];
      } else {
        nextSelections = existingSelections
          .filter((item) => item.projectId !== projectId)
          .map((item, index) => ({ ...item, displayOrder: index }));
      }

      return {
        ...prev,
        [slug]: {
          ...(prev[slug] ?? emptyForm),
          selectedProjects: nextSelections,
        },
      };
    });
  }, []);

  const handleProjectOrderChange = useCallback(
    (slug: string, projectId: string, value: number) => {
      setServiceForms((prev) => {
        const current = prev[slug];
        if (!current) {
          return prev;
        }

        const maxIndex = Math.max(current.selectedProjects.length - 1, 0);
        const sanitizedValue = Number.isNaN(value)
          ? 0
          : Math.min(Math.max(value, 0), maxIndex);

        const selections = current.selectedProjects.map((selection) =>
          selection.projectId === projectId
            ? { ...selection, displayOrder: sanitizedValue }
            : selection,
        );

        const normalized = selections
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((selection, index) => ({ ...selection, displayOrder: index }));

        return {
          ...prev,
          [slug]: {
            ...current,
            selectedProjects: normalized,
          },
        };
      });
    },
    [],
  );

  const hasChanges = useMemo(() => {
    return Object.entries(serviceForms).some(([slug, form]) => {
      const service = services.find((entry) => entry.slug === slug);
      if (!service) {
        return false;
      }

      const paragraphs = parseMultilineInput(form.infoParagraphs);
      const bullets = parseMultilineInput(form.infoBulletPoints);

      const assignments = (service.service_portfolio_projects ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((assignment) => assignment.project_id);

      const selectionIds = form.selectedProjects.map((selection) => selection.projectId);

      return (
        form.label !== service.label ||
        form.headline !== service.headline ||
        form.subline !== service.subline ||
        form.infoTitle !== (service.info_title ?? "") ||
        form.gradientStart !== (service.gradient_start ?? "") ||
        form.gradientEnd !== (service.gradient_end ?? "") ||
        form.imagePath !== (service.image_path ?? "") ||
        paragraphs.join("\n") !== normalizeMultiline(service.info_paragraphs ?? []) ||
        bullets.join("\n") !== normalizeMultiline(service.info_bullet_points ?? []) ||
        selectionIds.join("|") !== assignments.join("|")
      );
    });
  }, [serviceForms, services]);

  const handleSaveService = useCallback(
    async (slug: string) => {
      const form = serviceForms[slug];
      if (!form) {
        return;
      }

      setSavingSlug(slug);

      try {
        const paragraphs = parseMultilineInput(form.infoParagraphs);
        const bulletPoints = parseMultilineInput(form.infoBulletPoints);

        const { error: updateError } = await supabase
          .from("services")
          .update({
            label: form.label.trim(),
            headline: form.headline.trim(),
            subline: form.subline.trim(),
            info_title: form.infoTitle.trim() || null,
            info_paragraphs: paragraphs,
            info_bullet_points: bulletPoints,
            gradient_start: form.gradientStart.trim() || null,
            gradient_end: form.gradientEnd.trim() || null,
            image_path: form.imagePath.trim() || null,
          })
          .eq("slug", slug);

        if (updateError) {
          throw updateError;
        }

        const normalizedSelections = form.selectedProjects
          .map((selection, index) => ({
            project_id: selection.projectId,
            service_slug: slug,
            display_order: index,
          }))
          .filter((selection) => selection.project_id);

        const currentService = services.find((service) => service.slug === slug);
        const existingIds = new Set(
          (currentService?.service_portfolio_projects ?? []).map((assignment) => assignment.project_id),
        );
        const selectedIds = new Set(normalizedSelections.map((selection) => selection.project_id));

        const idsToDelete = Array.from(existingIds).filter((id) => !selectedIds.has(id));

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("service_portfolio_projects")
            .delete()
            .eq("service_slug", slug)
            .in("project_id", idsToDelete);

          if (deleteError) {
            throw deleteError;
          }
        }

        if (normalizedSelections.length > 0) {
          const { error: upsertError } = await supabase
            .from("service_portfolio_projects")
            .upsert(normalizedSelections, { onConflict: "service_slug,project_id" });

          if (upsertError) {
            throw upsertError;
          }
        }

        const { data: authData } = await supabase.auth.getUser();

        await logUserAction({
          action: "update-service",
          description: `Service ${form.label} aktualisiert`,
          context: "admin",
          userId: authData.user?.id ?? null,
          userEmail: authData.user?.email ?? null,
          entityType: "service",
          entityId: slug,
          metadata: {
            paragraphsCount: paragraphs.length,
            bulletPointsCount: bulletPoints.length,
            linkedProjects: normalizedSelections.length,
          },
        });

        showToast({
          title: "Gespeichert",
          message: `Service "${form.label}" wurde aktualisiert.`,
          type: "success",
        });

        await loadData();
      } catch (error) {
        console.error("Fehler beim Speichern des Services:", error);
        showToast({
          title: "Fehler",
          message: "Service konnte nicht gespeichert werden.",
          type: "error",
        });
      } finally {
        setSavingSlug(null);
      }
    },
    [serviceForms, services, showToast, loadData],
  );

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
        <div className={styles.pageHeader}>
          <div>
            <h1>Services verwalten</h1>
            <p>
              Pflege die Inhalte des Service-Sliders und verlinke passende Portfolio-Projekte.
            </p>
          </div>
          <div className={styles.headerStatus}>
            {savingSlug ? (
              <span className={styles.statusSaving}>Speichern läuft...</span>
            ) : hasChanges ? (
              <span className={styles.statusPending}>Es gibt ungespeicherte Änderungen</span>
            ) : (
              <span className={styles.statusSynced}>Alle Änderungen gespeichert</span>
            )}
          </div>
        </div>

        {loadingData ? (
          <div className={styles.loadingState}>Inhalte werden geladen…</div>
        ) : (
          <div className={styles.serviceGrid}>
            {services.map((service) => {
              const form = serviceForms[service.slug] ?? emptyForm;
              const selectedProjectIds = new Set(
                form.selectedProjects.map((selection) => selection.projectId),
              );

              return (
                <section key={service.id} className={styles.serviceCard}>
                  <header className={styles.serviceCardHeader}>
                    <div>
                      <h2>{form.label || service.label}</h2>
                      <span className={styles.serviceSlug}>/{service.slug}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => {
                        void handleSaveService(service.slug);
                      }}
                      disabled={savingSlug === service.slug}
                    >
                      {savingSlug === service.slug ? "Speichern…" : "Änderungen speichern"}
                    </button>
                  </header>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Label</span>
                      <input
                        type="text"
                        value={form.label}
                        onChange={(event) =>
                          handleInputChange(service.slug, "label", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Headline</span>
                      <input
                        type="text"
                        value={form.headline}
                        onChange={(event) =>
                          handleInputChange(service.slug, "headline", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.fieldFull}>
                      <span>Subline</span>
                      <textarea
                        rows={3}
                        value={form.subline}
                        onChange={(event) =>
                          handleInputChange(service.slug, "subline", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.fieldFull}>
                      <span>Infotitel (zweiter Bereich)</span>
                      <input
                        type="text"
                        value={form.infoTitle}
                        onChange={(event) =>
                          handleInputChange(service.slug, "infoTitle", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.fieldFull}>
                      <span>Infotext (Absätze, jeweils eine Zeile)</span>
                      <textarea
                        rows={6}
                        value={form.infoParagraphs}
                        onChange={(event) =>
                          handleInputChange(service.slug, "infoParagraphs", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.fieldFull}>
                      <span>Bullet Points (je Zeile ein Punkt)</span>
                      <textarea
                        rows={4}
                        value={form.infoBulletPoints}
                        onChange={(event) =>
                          handleInputChange(service.slug, "infoBulletPoints", event.target.value)
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Gradient Startfarbe</span>
                      <input
                        type="text"
                        value={form.gradientStart}
                        onChange={(event) =>
                          handleInputChange(service.slug, "gradientStart", event.target.value)
                        }
                        placeholder="#111827"
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Gradient Endfarbe</span>
                      <input
                        type="text"
                        value={form.gradientEnd}
                        onChange={(event) =>
                          handleInputChange(service.slug, "gradientEnd", event.target.value)
                        }
                        placeholder="#1f2937"
                      />
                    </label>
                    <label className={styles.fieldFull}>
                      <span>Bildpfad / URL</span>
                      <input
                        type="text"
                        value={form.imagePath}
                        onChange={(event) =>
                          handleInputChange(service.slug, "imagePath", event.target.value)
                        }
                        placeholder="service-carousel/dein-bild.webp"
                      />
                    </label>
                  </div>

                  <div className={styles.projectsSection}>
                    <h3>Portfolio-Verknüpfungen</h3>
                    <p className={styles.projectsHint}>
                      Wähle passende Projekte aus und lege die Reihenfolge fest.
                    </p>

                    {projects.length === 0 ? (
                      <p className={styles.emptyProjects}>Keine Portfolio-Projekte vorhanden.</p>
                    ) : (
                      <div className={styles.projectsGrid}>
                        <div className={styles.availableProjects}>
                          <h4>Verfügbare Projekte</h4>
                          <ul>
                            {projects.map((project) => {
                              const checked = selectedProjectIds.has(project.id);
                              return (
                                <li key={project.id}>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(event) =>
                                        handleToggleProject(
                                          service.slug,
                                          project.id,
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    <span>
                                      {project.title}
                                      {project.subtitle ? (
                                        <span className={styles.projectSubtitle}>
                                          {project.subtitle}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className={styles.selectedProjects}>
                          <h4>Ausgewählte Projekte</h4>
                          {form.selectedProjects.length === 0 ? (
                            <p className={styles.emptyProjects}>
                              Noch keine Projekte ausgewählt.
                            </p>
                          ) : (
                            <ul>
                              {form.selectedProjects.map((selection) => {
                                const project = projects.find((item) => item.id === selection.projectId);
                                if (!project) {
                                  return null;
                                }

                                return (
                                  <li key={selection.projectId}>
                                    <div className={styles.selectedProjectRow}>
                                      <span>
                                        {project.title}
                                        {project.subtitle ? (
                                          <span className={styles.projectSubtitle}>
                                            {project.subtitle}
                                          </span>
                                        ) : null}
                                      </span>
                                      <div className={styles.projectOrderControls}>
                                        <label>
                                          Reihenfolge
                                          <input
                                            type="number"
                                            min={0}
                                            max={Math.max(form.selectedProjects.length - 1, 0)}
                                            value={selection.displayOrder}
                                            onChange={(event) =>
                                              handleProjectOrderChange(
                                                service.slug,
                                                selection.projectId,
                                                Number(event.target.value),
                                              )
                                            }
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleProject(
                                              service.slug,
                                              selection.projectId,
                                              false,
                                            )
                                          }
                                        >
                                          Entfernen
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
