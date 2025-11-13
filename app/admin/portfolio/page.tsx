"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import styles from "./page.module.css";
import { createSlug } from "@/lib/slug";

type PortfolioSettings = {
  id: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_description: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  background_file_path: string | null;
  background_public_url: string | null;
};

type PortfolioProject = {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  slug: string | null;
  cover_public_url: string | null;
  display_order: number;
  is_featured: boolean;
};

type PortfolioProjectImage = {
  id: string;
  project_id: string;
  caption: string | null;
  file_path: string;
  public_url: string;
  display_order: number;
};

type ProjectFormState = {
  title: string;
  subtitle: string;
  excerpt: string;
  slug: string;
  displayOrder: number;
  isFeatured: boolean;
};

type CurrentUser = { id: string; email?: string | null };

type InputEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

const backgroundBucket = "portfolio-backgrounds";
const galleryBucket = "portfolio-project-images";

const defaultProjectForm: ProjectFormState = {
  title: "",
  subtitle: "",
  excerpt: "",
  slug: "",
  displayOrder: 0,
  isFeatured: false,
};

const sortProjects = (projects: PortfolioProject[]) =>
  [...projects].sort((a, b) => {
    if (a.display_order === b.display_order) {
      return a.title.localeCompare(b.title);
    }
    return a.display_order - b.display_order;
  });

const mapProjectToForm = (project: PortfolioProject): ProjectFormState => ({
  title: project.title,
  subtitle: project.subtitle ?? "",
  excerpt: project.excerpt ?? "",
  slug: project.slug ?? "",
  displayOrder: project.display_order,
  isFeatured: project.is_featured,
});

export default function AdminPortfolioPage() {
  const { loading: verifying } = useVerifyAdminAccess();

  const [settings, setSettings] = useState<PortfolioSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    heroHeadline: "",
    heroSubheadline: "",
    heroDescription: "",
    heroCtaLabel: "",
    heroCtaUrl: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState(false);

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [newProjectForm, setNewProjectForm] = useState<ProjectFormState>({
    ...defaultProjectForm,
  });
  const [newProjectSlugManuallyEdited, setNewProjectSlugManuallyEdited] =
    useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectForm, setEditProjectForm] = useState<ProjectFormState>({
    ...defaultProjectForm,
  });
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(
    null,
  );
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );

  const [savingCoverProjectId, setSavingCoverProjectId] = useState<string | null>(
    null,
  );

  const [projectImages, setProjectImages] = useState<
    Record<string, PortfolioProjectImage[]>
  >({});
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [fileInputResetKeys, setFileInputResetKeys] = useState<
    Record<string, number>
  >({});
  const [imageCaptions, setImageCaptions] = useState<Record<string, string>>({});
  const [uploadingImageProjectId, setUploadingImageProjectId] = useState<
    string | null
  >(null);
  const [savingCaptionId, setSavingCaptionId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const existingProjectSlugs = useMemo(
    () =>
      projects
        .map((project) => project.slug?.trim())
        .filter((slug): slug is string => Boolean(slug)),
    [projects],
  );

  const generateUniqueProjectSlug = useCallback(
    (title: string) => {
      const baseSlug = createSlug(title);

      if (!baseSlug) {
        return "";
      }

      const slugSet = new Set(existingProjectSlugs);
      let candidate = baseSlug;
      let counter = 2;

      while (slugSet.has(candidate)) {
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
      }

      return candidate;
    },
    [existingProjectSlugs],
  );

  const newProjectTitle = newProjectForm.title;
  const newProjectSlug = newProjectForm.slug;

  useEffect(() => {
    if (!newProjectSlugManuallyEdited && newProjectTitle.trim()) {
      const updatedSlug = generateUniqueProjectSlug(newProjectTitle);

      if (updatedSlug !== newProjectSlug) {
        setNewProjectForm((previous) => ({
          ...previous,
          slug: updatedSlug,
        }));
      }
    }
  }, [
    generateUniqueProjectSlug,
    newProjectSlug,
    newProjectSlugManuallyEdited,
    newProjectTitle,
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setProjectsLoading(true);

      try {
        const [{ data: settingsData, error: settingsError }, { data: projectsData, error: projectsFetchError }, { data: imagesData, error: imagesError }] =
          await Promise.all([
            supabase
              .from("portfolio_settings")
              .select(
                "id, hero_headline, hero_subheadline, hero_description, hero_cta_label, hero_cta_url, background_file_path, background_public_url",
              )
              .order("updated_at", { ascending: false })
              .limit(1),
            supabase
              .from("portfolio_projects")
              .select(
                "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
              )
              .order("display_order", { ascending: true })
              .order("created_at", { ascending: true }),
            supabase
              .from("portfolio_project_images")
              .select(
                "id, project_id, caption, file_path, public_url, display_order",
              )
              .order("display_order", { ascending: true })
              .order("created_at", { ascending: true }),
          ]);

        if (settingsError) {
          throw settingsError;
        }
        if (projectsFetchError) {
          throw projectsFetchError;
        }
        if (imagesError) {
          throw imagesError;
        }

        const settingsRecord = settingsData?.[0] ?? null;
        setSettings(settingsRecord);
        setSettingsForm({
          heroHeadline: settingsRecord?.hero_headline ?? "",
          heroSubheadline: settingsRecord?.hero_subheadline ?? "",
          heroDescription: settingsRecord?.hero_description ?? "",
          heroCtaLabel: settingsRecord?.hero_cta_label ?? "",
          heroCtaUrl: settingsRecord?.hero_cta_url ?? "",
        });

        const sortedProjects = sortProjects(projectsData ?? []);
        setProjects(sortedProjects);

        if (sortedProjects.length === 0) {
          setNewProjectForm((previous) => ({
            ...previous,
            displayOrder: 1,
          }));
        } else {
          const maxOrder = Math.max(
            ...sortedProjects.map((project) => project.display_order),
          );
          setNewProjectForm((previous) => ({
            ...previous,
            displayOrder: maxOrder + 1,
          }));
        }

        const groupedImages = (imagesData ?? []).reduce<
          Record<string, PortfolioProjectImage[]>
        >((accumulator, image) => {
          const list = accumulator[image.project_id] ?? [];
          accumulator[image.project_id] = [...list, image];
          return accumulator;
        }, {});

        setProjectImages(groupedImages);

        const captionMap = (imagesData ?? []).reduce<Record<string, string>>(
          (accumulator, image) => {
            accumulator[image.id] = image.caption ?? "";
            return accumulator;
          },
          {},
        );
        setImageCaptions(captionMap);
      } catch (error) {
        console.error("Fehler beim Laden der Portfolio-Daten:", error);
        setProjectsError(
          error instanceof Error
            ? error.message
            : "Die Portfolio-Daten konnten nicht geladen werden.",
        );
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const currentProjects = useMemo(() => sortProjects(projects), [projects]);

  const handleSettingsChange = (event: InputEvent) => {
    const { name, value } = event.target;
    setSettingsForm((previous) => ({ ...previous, [name]: value }));
  };

  const fetchCurrentUser = async (): Promise<CurrentUser> => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(
        error?.message ?? "Es konnte kein angemeldeter Nutzer gefunden werden.",
      );
    }

    return { id: user.id, email: user.email };
  };

  const handleSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingSettings(true);

    try {
      const currentUser = await fetchCurrentUser();
      const payload = {
        id: settings?.id,
        hero_headline: settingsForm.heroHeadline.trim() || null,
        hero_subheadline: settingsForm.heroSubheadline.trim() || null,
        hero_description: settingsForm.heroDescription.trim() || null,
        hero_cta_label: settingsForm.heroCtaLabel.trim() || null,
        hero_cta_url: settingsForm.heroCtaUrl.trim() || null,
        background_file_path: settings?.background_file_path ?? null,
        background_public_url: settings?.background_public_url ?? null,
      };

      const { data, error } = await supabase
        .from("portfolio_settings")
        .upsert(payload, { onConflict: "id" })
        .select(
          "id, hero_headline, hero_subheadline, hero_description, hero_cta_label, hero_cta_url, background_file_path, background_public_url",
        )
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);

      await logUserAction({
        action: "portfolio_settings_saved",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_settings",
        entityId: data.id,
        metadata: {
          heroHeadline: settingsForm.heroHeadline,
          heroSubheadline: settingsForm.heroSubheadline,
        },
      });

      alert("Portfolio Einstellungen wurden gespeichert.");
    } catch (error) {
      console.error("Fehler beim Speichern der Portfolio-Einstellungen:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Die Portfolio-Einstellungen konnten nicht gespeichert werden.",
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBackgroundUpload = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!backgroundFile) {
      alert("Bitte wähle zuerst ein Hintergrundbild aus.");
      return;
    }

    setUploadingBackground(true);

    try {
      const currentUser = await fetchCurrentUser();
      const fileExtension = backgroundFile.name.split(".").pop();
      const filePath = `${currentUser.id}/portfolio-background-${Date.now()}.${
        fileExtension ?? "jpg"
      }`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(backgroundBucket)
        .upload(filePath, backgroundFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(backgroundBucket)
        .getPublicUrl(uploadData?.path ?? filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Die öffentliche URL für das Hintergrundbild fehlt.");
      }

      const { data, error } = await supabase
        .from("portfolio_settings")
        .upsert(
          {
            id: settings?.id,
            hero_headline: settingsForm.heroHeadline.trim() || null,
            hero_subheadline: settingsForm.heroSubheadline.trim() || null,
            hero_description: settingsForm.heroDescription.trim() || null,
            hero_cta_label: settingsForm.heroCtaLabel.trim() || null,
            hero_cta_url: settingsForm.heroCtaUrl.trim() || null,
            background_file_path: uploadData?.path ?? filePath,
            background_public_url: publicUrl,
          },
          { onConflict: "id" },
        )
        .select(
          "id, hero_headline, hero_subheadline, hero_description, hero_cta_label, hero_cta_url, background_file_path, background_public_url",
        )
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);
      setBackgroundFile(null);

      await logUserAction({
        action: "portfolio_background_uploaded",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_settings",
        entityId: data.id,
        metadata: {
          filePath: uploadData?.path ?? filePath,
          publicUrl,
        },
      });

      alert("Hintergrundbild erfolgreich aktualisiert.");
    } catch (error) {
      console.error("Fehler beim Hochladen des Hintergrundbildes:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Hintergrundbild konnte nicht hochgeladen werden.",
      );
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleBackgroundDelete = async () => {
    if (!settings?.background_file_path) {
      return;
    }

    setDeletingBackground(true);

    try {
      const currentUser = await fetchCurrentUser();

      const { error: storageError } = await supabase.storage
        .from(backgroundBucket)
        .remove([settings.background_file_path]);

      if (storageError) {
        throw storageError;
      }

      const { data, error } = await supabase
        .from("portfolio_settings")
        .upsert(
          {
            id: settings.id,
            hero_headline: settingsForm.heroHeadline.trim() || null,
            hero_subheadline: settingsForm.heroSubheadline.trim() || null,
            hero_description: settingsForm.heroDescription.trim() || null,
            hero_cta_label: settingsForm.heroCtaLabel.trim() || null,
            hero_cta_url: settingsForm.heroCtaUrl.trim() || null,
            background_file_path: null,
            background_public_url: null,
          },
          { onConflict: "id" },
        )
        .select(
          "id, hero_headline, hero_subheadline, hero_description, hero_cta_label, hero_cta_url, background_file_path, background_public_url",
        )
        .single();

      if (error) {
        throw error;
      }

      setSettings(data);

      await logUserAction({
        action: "portfolio_background_deleted",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_settings",
        entityId: data.id,
      });

      alert("Hintergrundbild wurde entfernt.");
    } catch (error) {
      console.error("Fehler beim Löschen des Hintergrundbildes:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Hintergrundbild konnte nicht gelöscht werden.",
      );
    } finally {
      setDeletingBackground(false);
    }
  };

  const handleNewProjectChange = (event: InputEvent) => {
    const { name } = event.target;

    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
    ) {
      setNewProjectForm((previous) => ({
        ...previous,
        [name]: event.target.checked,
      }));
      return;
    }

    const { value } = event.target;

    if (name === "slug") {
      const trimmedValue = value.trim();
      setNewProjectSlugManuallyEdited(trimmedValue.length > 0);
      setNewProjectForm((previous) => ({
        ...previous,
        slug: value,
      }));
      return;
    }

    if (name === "title") {
      setNewProjectForm((previous) => {
        const updatedForm = {
          ...previous,
          title: value,
        };

        if (!newProjectSlugManuallyEdited) {
          return {
            ...updatedForm,
            slug: generateUniqueProjectSlug(value),
          };
        }

        return updatedForm;
      });
      return;
    }

    setNewProjectForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleNewProjectSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!newProjectForm.title.trim()) {
      alert("Bitte gib einen Projekttitel ein.");
      return;
    }

    setCreatingProject(true);

    try {
      const currentUser = await fetchCurrentUser();

      const manuallyEditedSlug = createSlug(newProjectForm.slug.trim());
      const autoGeneratedSlug = generateUniqueProjectSlug(newProjectForm.title);
      const resolvedSlug = newProjectSlugManuallyEdited
        ? manuallyEditedSlug
        : autoGeneratedSlug;

      const insertPayload = {
        title: newProjectForm.title.trim(),
        subtitle: newProjectForm.subtitle.trim() || null,
        excerpt: newProjectForm.excerpt.trim() || null,
        slug: resolvedSlug || null,
        display_order: Number.isFinite(newProjectForm.displayOrder)
          ? newProjectForm.displayOrder
          : 0,
        is_featured: newProjectForm.isFeatured,
      };

      const { data, error } = await supabase
        .from("portfolio_projects")
        .insert(insertPayload)
        .select(
          "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
        )
        .single();

      if (error) {
        throw error;
      }

      setProjects((previous) => sortProjects([...previous, data]));
      setNewProjectForm({
        ...defaultProjectForm,
        displayOrder: data.display_order + 1,
      });
      setNewProjectSlugManuallyEdited(false);

      await logUserAction({
        action: "portfolio_project_created",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project",
        entityId: data.id,
        metadata: {
          title: data.title,
          displayOrder: data.display_order,
        },
      });

      alert("Projekt wurde angelegt. Du kannst nun ein Cover und Bilder hinzufügen.");
    } catch (error) {
      console.error("Fehler beim Anlegen eines Projekts:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Projekt konnte nicht angelegt werden.",
      );
    } finally {
      setCreatingProject(false);
    }
  };

  const startEditingProject = (project: PortfolioProject) => {
    setEditingProjectId(project.id);
    setEditProjectForm(mapProjectToForm(project));
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditProjectForm({ ...defaultProjectForm });
  };

  const handleEditProjectChange = (event: InputEvent) => {
    const { name, value } = event.target;
    const isCheckbox =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox";

    setEditProjectForm((previous) => ({
      ...previous,
      [name]: isCheckbox
        ? (event.target as HTMLInputElement).checked
        : value,
    }));
  };

  const handleUpdateProject = async (
    event: FormEvent<HTMLFormElement>,
    projectId: string,
  ) => {
    event.preventDefault();

    if (!editProjectForm.title.trim()) {
      alert("Bitte gib einen Projekttitel ein.");
      return;
    }

    setUpdatingProjectId(projectId);

    try {
      const currentUser = await fetchCurrentUser();

      const updatePayload = {
        title: editProjectForm.title.trim(),
        subtitle: editProjectForm.subtitle.trim() || null,
        excerpt: editProjectForm.excerpt.trim() || null,
        slug: editProjectForm.slug.trim() || null,
        display_order: Number.isFinite(editProjectForm.displayOrder)
          ? editProjectForm.displayOrder
          : 0,
        is_featured: editProjectForm.isFeatured,
      };

      const { data, error } = await supabase
        .from("portfolio_projects")
        .update(updatePayload)
        .eq("id", projectId)
        .select(
          "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
        )
        .single();

      if (error) {
        throw error;
      }

      setProjects((previous) =>
        sortProjects(previous.map((project) => (project.id === projectId ? data : project))),
      );
      cancelEditing();

      await logUserAction({
        action: "portfolio_project_updated",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project",
        entityId: projectId,
        metadata: {
          title: data.title,
          displayOrder: data.display_order,
        },
      });

      alert("Projekt wurde aktualisiert.");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Projekts:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Projekt konnte nicht aktualisiert werden.",
      );
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const handleDeleteProject = async (project: PortfolioProject) => {
    if (
      !confirm(
        `Möchtest du das Projekt "${project.title}" wirklich löschen? Dabei werden auch alle zugehörigen Projektbilder entfernt.`,
      )
    ) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      const currentUser = await fetchCurrentUser();

      const { data: existingImages, error: fetchImagesError } = await supabase
        .from("portfolio_project_images")
        .select("id, file_path")
        .eq("project_id", project.id);

      if (fetchImagesError) {
        throw fetchImagesError;
      }

      const filePaths = (existingImages ?? [])
        .map((image) => image.file_path)
        .filter((filePath): filePath is string => Boolean(filePath));

      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(galleryBucket)
          .remove(filePaths);

        if (
          storageError &&
          !storageError.message?.toLowerCase().includes("not found")
        ) {
          throw storageError;
        }
      }

      if ((existingImages?.length ?? 0) > 0) {
        const { error: deleteImagesError } = await supabase
          .from("portfolio_project_images")
          .delete()
          .eq("project_id", project.id);

        if (deleteImagesError) {
          throw deleteImagesError;
        }
      }

      const { error } = await supabase
        .from("portfolio_projects")
        .delete()
        .eq("id", project.id);

      if (error) {
        throw error;
      }

      setProjects((previous) =>
        previous.filter((existingProject) => existingProject.id !== project.id),
      );

      setProjectImages((previous) => {
        const updated = { ...previous };
        delete updated[project.id];
        return updated;
      });

      if (existingImages?.length) {
        setImageCaptions((previous) => {
          const updated = { ...previous };
          for (const image of existingImages) {
            delete updated[image.id];
          }
          return updated;
        });
      }

      await logUserAction({
        action: "portfolio_project_deleted",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project",
        entityId: project.id,
        metadata: {
          title: project.title,
          deletedImages: existingImages?.length ?? 0,
        },
      });

      alert("Projekt wurde gelöscht.");
    } catch (error) {
      console.error("Fehler beim Löschen des Projekts:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Projekt konnte nicht gelöscht werden.",
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  const updateProjectState = (updated: PortfolioProject) => {
    setProjects((previous) =>
      sortProjects(previous.map((item) => (item.id === updated.id ? updated : item))),
    );
  };

  const handleSelectCoverFromGallery = async (
    project: PortfolioProject,
    image: PortfolioProjectImage,
  ) => {
    setSavingCoverProjectId(project.id);

    try {
      const currentUser = await fetchCurrentUser();

      const { data, error } = await supabase
        .from("portfolio_projects")
        .update({
          cover_public_url: image.public_url,
        })
        .eq("id", project.id)
        .select(
          "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
        )
        .single();

      if (error) {
        throw error;
      }

      updateProjectState(data);

      await logUserAction({
        action: "portfolio_project_cover_selected",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project",
        entityId: project.id,
        metadata: {
          imageId: image.id,
          filePath: image.file_path,
        },
      });

      alert("Cover-Bild wurde aktualisiert.");
    } catch (error) {
      console.error("Fehler beim Festlegen des Cover-Bildes:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Cover-Bild konnte nicht gespeichert werden.",
      );
    } finally {
      setSavingCoverProjectId(null);
    }
  };

  const handleRemoveCover = async (project: PortfolioProject) => {
    if (!project.cover_public_url) {
      return;
    }

    setSavingCoverProjectId(project.id);

    try {
      const currentUser = await fetchCurrentUser();

      const { data, error } = await supabase
        .from("portfolio_projects")
        .update({
          cover_public_url: null,
        })
        .eq("id", project.id)
        .select(
          "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
        )
        .single();

      if (error) {
        throw error;
      }

      updateProjectState(data);

      await logUserAction({
        action: "portfolio_project_cover_cleared",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project",
        entityId: project.id,
      });

      alert("Cover-Bild wurde entfernt.");
    } catch (error) {
      console.error("Fehler beim Entfernen des Cover-Bildes:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Cover-Bild konnte nicht entfernt werden.",
      );
    } finally {
      setSavingCoverProjectId(null);
    }
  };

  const handleGallerySelection = (projectId: string, files: File[]) => {
    setImageFiles((previous) => {
      if (files.length === 0) {
        if (!previous[projectId]) {
          return previous;
        }

        const updated = { ...previous };
        delete updated[projectId];
        return updated;
      }

      return {
        ...previous,
        [projectId]: files,
      };
    });

    if (files.length > 0) {
      setFileInputResetKeys((previous) => ({
        ...previous,
        [projectId]: (previous[projectId] ?? 0) + 1,
      }));
    }
  };

  const handleGalleryUpload = async (
    event: FormEvent<HTMLFormElement>,
    project: PortfolioProject,
  ) => {
    event.preventDefault();

    let selectedFiles = imageFiles[project.id] ?? [];

    if (selectedFiles.length === 0) {
      const fileInput = event.currentTarget.querySelector<HTMLInputElement>(
        "input[type='file']",
      );

      if (fileInput?.files?.length) {
        selectedFiles = Array.from(fileInput.files);
      }
    }

    if (selectedFiles.length === 0) {
      alert("Bitte wähle zuerst mindestens ein Projektfoto aus.");
      return;
    }

    setUploadingImageProjectId(project.id);

    try {
      const currentUser = await fetchCurrentUser();
      const existingImages = projectImages[project.id] ?? [];
      let nextDisplayOrder =
        (existingImages[existingImages.length - 1]?.display_order ?? 0) + 1;
      const newImages: PortfolioProjectImage[] = [];
      const newCaptions: Record<string, string> = {};

      for (const file of selectedFiles) {
        const fileExtension = file.name.split(".").pop();
        const filePath = `${currentUser.id}/${project.id}/gallery-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExtension ?? "jpg"}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(galleryBucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from(galleryBucket)
          .getPublicUrl(uploadData?.path ?? filePath);

        const publicUrl = publicUrlData?.publicUrl;

        if (!publicUrl) {
          throw new Error("Die öffentliche URL für das Projektfoto fehlt.");
        }

        const { data, error } = await supabase
          .from("portfolio_project_images")
          .insert({
            project_id: project.id,
            caption: null,
            file_path: uploadData?.path ?? filePath,
            public_url: publicUrl,
            display_order: nextDisplayOrder,
          })
          .select(
            "id, project_id, caption, file_path, public_url, display_order",
          )
          .single();

        if (error) {
          throw error;
        }

        nextDisplayOrder += 1;
        newImages.push(data);
        newCaptions[data.id] = "";

        await logUserAction({
          action: "portfolio_project_image_uploaded",
          context: "admin",
          userId: currentUser.id,
          userEmail: currentUser.email ?? null,
          entityType: "portfolio_project_image",
          entityId: data.id,
          metadata: {
            projectId: project.id,
            filePath: uploadData?.path ?? filePath,
          },
        });
      }

      setProjectImages((previous) => ({
        ...previous,
        [project.id]: [...(previous[project.id] ?? []), ...newImages],
      }));
      setImageFiles((previous) => {
        if (!previous[project.id]) {
          return previous;
        }

        const updated = { ...previous };
        delete updated[project.id];
        return updated;
      });
      setImageCaptions((previous) => ({ ...previous, ...newCaptions }));

      alert(
        newImages.length === 1
          ? "Projektfoto wurde hinzugefügt."
          : `${newImages.length} Projektfotos wurden hinzugefügt.`,
      );
    } catch (error) {
      console.error("Fehler beim Hochladen des Projektfotos:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Projektfoto konnte nicht hochgeladen werden.",
      );
    } finally {
      setUploadingImageProjectId(null);
    }
  };

  const handleGalleryImageDelete = async (
    image: PortfolioProjectImage,
  ) => {
    if (!confirm("Möchtest du dieses Projektfoto wirklich löschen?")) {
      return;
    }

    setDeletingImageId(image.id);

    try {
      const currentUser = await fetchCurrentUser();

      const { error: storageError } = await supabase.storage
        .from(galleryBucket)
        .remove([image.file_path]);

      if (storageError) {
        throw storageError;
      }

      const { error } = await supabase
        .from("portfolio_project_images")
        .delete()
        .eq("id", image.id);

      if (error) {
        throw error;
      }

      let coverCleared = false;

      const projectForImage = projects.find(
        (project) => project.id === image.project_id,
      );

      if (projectForImage?.cover_public_url === image.public_url) {
        const { data: updatedProject, error: coverError } = await supabase
          .from("portfolio_projects")
          .update({
            cover_public_url: null,
          })
          .eq("id", image.project_id)
          .select(
            "id, title, subtitle, excerpt, slug, cover_public_url, display_order, is_featured",
          )
          .single();

        if (coverError) {
          throw coverError;
        }

        updateProjectState(updatedProject);
        coverCleared = true;
      }

      setProjectImages((previous) => ({
        ...previous,
        [image.project_id]: (previous[image.project_id] ?? []).filter(
          (item) => item.id !== image.id,
        ),
      }));

      setImageCaptions((previous) => {
        const updated = { ...previous };
        delete updated[image.id];
        return updated;
      });

      await logUserAction({
        action: "portfolio_project_image_deleted",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project_image",
        entityId: image.id,
        metadata: {
          projectId: image.project_id,
          coverCleared,
        },
      });

      alert("Projektfoto wurde gelöscht.");
    } catch (error) {
      console.error("Fehler beim Löschen des Projektfotos:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Das Projektfoto konnte nicht gelöscht werden.",
      );
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleGalleryCaptionChange = (
    imageId: string,
    caption: string,
  ) => {
    setImageCaptions((previous) => ({ ...previous, [imageId]: caption }));
  };

  const handleGalleryCaptionSave = async (image: PortfolioProjectImage) => {
    setSavingCaptionId(image.id);

    try {
      const currentUser = await fetchCurrentUser();
      const caption = imageCaptions[image.id]?.trim() || null;

      const { data, error } = await supabase
        .from("portfolio_project_images")
        .update({ caption })
        .eq("id", image.id)
        .select(
          "id, project_id, caption, file_path, public_url, display_order",
        )
        .single();

      if (error) {
        throw error;
      }

      setProjectImages((previous) => ({
        ...previous,
        [image.project_id]: (previous[image.project_id] ?? []).map((item) =>
          item.id === image.id ? data : item,
        ),
      }));

      await logUserAction({
        action: "portfolio_project_image_caption_saved",
        context: "admin",
        userId: currentUser.id,
        userEmail: currentUser.email ?? null,
        entityType: "portfolio_project_image",
        entityId: image.id,
        metadata: {
          projectId: image.project_id,
          caption,
        },
      });

      alert("Bildbeschreibung wurde gespeichert.");
    } catch (error) {
      console.error("Fehler beim Speichern der Bildbeschreibung:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Die Bildbeschreibung konnte nicht gespeichert werden.",
      );
    } finally {
      setSavingCaptionId(null);
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
      <div className={`admin-content ${styles.portfolioContent}`}>
        <header className={styles.header}>
          <div>
            <h1>Portfolio Manager</h1>
            <p>
              Pflege hier den Hintergrundbereich sowie die Portfolio-Projekte, die
              auf der öffentlichen Seite dargestellt werden.
            </p>
          </div>
        </header>

        <section className="admin-card">
          <h2>Hero-Inhalte</h2>
          <p>
            Hinterlege hier den Text und das Hintergrundbild für den Portfolio
            Bereich. Der Text erscheint links im Layout, das Bild füllt die
            komplette Fläche aus.
          </p>

          <form className={styles.heroForm} onSubmit={handleSettingsSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="heroHeadline">Hauptüberschrift</label>
              <input
                id="heroHeadline"
                name="heroHeadline"
                type="text"
                value={settingsForm.heroHeadline}
                onChange={handleSettingsChange}
                placeholder="Z. B. Saint Antönien"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="heroSubheadline">Subheadline</label>
              <input
                id="heroSubheadline"
                name="heroSubheadline"
                type="text"
                value={settingsForm.heroSubheadline}
                onChange={handleSettingsChange}
                placeholder="Z. B. Switzerland Alps"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="heroDescription">Beschreibung</label>
              <textarea
                id="heroDescription"
                name="heroDescription"
                value={settingsForm.heroDescription}
                onChange={handleSettingsChange}
                placeholder="Kurze Beschreibung, die im Hero-Bereich angezeigt wird."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="heroCtaLabel">Button-Label</label>
              <input
                id="heroCtaLabel"
                name="heroCtaLabel"
                type="text"
                value={settingsForm.heroCtaLabel}
                onChange={handleSettingsChange}
                placeholder="Z. B. Projekt anfragen"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="heroCtaUrl">Button-URL</label>
              <input
                id="heroCtaUrl"
                name="heroCtaUrl"
                type="url"
                value={settingsForm.heroCtaUrl}
                onChange={handleSettingsChange}
                placeholder="https://..."
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className="adminButton"
                disabled={savingSettings}
              >
                {savingSettings ? "Speichere..." : "Hero-Inhalte speichern"}
              </button>
            </div>
          </form>

          <div className={styles.backgroundSection}>
            <h3>Hintergrundbild</h3>

            {settings?.background_public_url ? (
              <div className={styles.backgroundPreview}>
                <Image
                  src={settings.background_public_url}
                  alt="Aktueller Portfolio Hintergrund"
                  width={640}
                  height={360}
                  className={styles.backgroundImage}
                />
                <p className={styles.filePath}>{settings.background_file_path}</p>
                <button
                  type="button"
                  className="adminButton"
                  onClick={handleBackgroundDelete}
                  disabled={deletingBackground}
                >
                  {deletingBackground ? "Lösche..." : "Bild entfernen"}
                </button>
              </div>
            ) : (
              <p>Es ist noch kein Hintergrundbild hinterlegt.</p>
            )}

            <form
              className="admin-form"
              onSubmit={handleBackgroundUpload}
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
                {uploadingBackground
                  ? "Lade hoch..."
                  : "Hintergrund speichern"}
              </button>
            </form>
          </div>
        </section>

        <section className="admin-card">
          <h2>Portfolio-Projekte</h2>
          <p>
            Lege neue Projekte an, aktualisiere bestehende Einträge und verwalte
            Cover- sowie Projektbilder. Die Reihenfolge wird über das Feld
            <strong> Anzeige-Reihenfolge</strong> gesteuert.
          </p>

          <div className={styles.projectManager}>
            <div className={styles.newProject}>
              <h3>Neues Projekt anlegen</h3>
              <form
                className={styles.projectForm}
                onSubmit={handleNewProjectSubmit}
              >
                <div className={styles.fieldGroup}>
                  <label htmlFor="new-title">Titel *</label>
                  <input
                    id="new-title"
                    name="title"
                    type="text"
                    value={newProjectForm.title}
                    onChange={handleNewProjectChange}
                    placeholder="Z. B. Alpine Panorama"
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="new-subtitle">Untertitel</label>
                  <input
                    id="new-subtitle"
                    name="subtitle"
                    type="text"
                    value={newProjectForm.subtitle}
                    onChange={handleNewProjectChange}
                    placeholder="Zusätzliche Projektzeile"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="new-excerpt">Kurzbeschreibung</label>
                  <textarea
                    id="new-excerpt"
                    name="excerpt"
                    value={newProjectForm.excerpt}
                    onChange={handleNewProjectChange}
                    placeholder="Kurzer Teasertext zum Projekt"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="new-slug">Slug</label>
                  <input
                    id="new-slug"
                    name="slug"
                    type="text"
                    value={newProjectForm.slug}
                    onChange={handleNewProjectChange}
                    placeholder="portfolio-projekt"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="new-displayOrder">Anzeige-Reihenfolge</label>
                  <input
                    id="new-displayOrder"
                    name="displayOrder"
                    type="number"
                    min={0}
                    value={newProjectForm.displayOrder}
                    onChange={(event) =>
                      setNewProjectForm((previous) => ({
                        ...previous,
                        displayOrder: Number(event.target.value) || 0,
                      }))
                    }
                    placeholder="Z. B. 1"
                  />
                </div>

                <label className={styles.checkboxRow} htmlFor="new-isFeatured">
                  <input
                    id="new-isFeatured"
                    name="isFeatured"
                    type="checkbox"
                    checked={newProjectForm.isFeatured}
                    onChange={handleNewProjectChange}
                  />
                  Highlight-Projekt
                </label>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className="adminButton"
                    disabled={creatingProject}
                  >
                    {creatingProject ? "Erstelle..." : "Projekt anlegen"}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.projectList}>
              <h3>Bestehende Projekte</h3>

              {projectsLoading && <p>Lade Projekte...</p>}
              {projectsError && !projectsLoading && (
                <p className={styles.errorText}>{projectsError}</p>
              )}

              {!projectsLoading && !projectsError && currentProjects.length === 0 && (
                <p className={styles.emptyState}>
                  Es wurden noch keine Projekte angelegt.
                </p>
              )}

              {!projectsLoading && !projectsError && currentProjects.length > 0 && (
                <div className={styles.projectItems}>
                  {currentProjects.map((project) => {
                    const projectGallery = projectImages[project.id] ?? [];

                    return (
                      <article key={project.id} className={styles.projectCard}>
                        <header className={styles.projectHeader}>
                          <div>
                            <h4>{project.title}</h4>
                            {project.subtitle ? (
                              <p className={styles.projectSubtitle}>
                                {project.subtitle}
                              </p>
                            ) : null}
                            <p className={styles.projectMeta}>
                              Reihenfolge: {project.display_order}
                              {project.is_featured ? " • Highlight" : ""}
                            </p>
                          </div>
                          <div className={styles.projectActions}>
                            <button
                              type="button"
                              className="adminButton"
                              onClick={() => startEditingProject(project)}
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              className="adminButton"
                              onClick={() => handleDeleteProject(project)}
                              disabled={deletingProjectId === project.id}
                            >
                              {deletingProjectId === project.id
                                ? "Lösche..."
                                : "Löschen"}
                            </button>
                          </div>
                        </header>

                        <div className={styles.coverSection}>
                          <h5>Cover-Bild</h5>
                          <div className={styles.coverPreview}>
                            {project.cover_public_url ? (
                              <div className={styles.coverImageWrapper}>
                                <Image
                                  src={project.cover_public_url}
                                  alt={`Cover von ${project.title}`}
                                  width={160}
                                  height={220}
                                  className={styles.coverImage}
                                />
                              </div>
                            ) : (
                              <div className={styles.coverPlaceholder}>
                                Kein Cover ausgewählt
                              </div>
                            )}
                            <p className={styles.coverHint}>
                              Wähle unten in den Projektfotos ein Bild aus, um es als Cover zu
                              übernehmen.
                            </p>

                            {project.cover_public_url ? (
                              <button
                                type="button"
                                className="adminButton"
                                onClick={() => handleRemoveCover(project)}
                                disabled={savingCoverProjectId === project.id}
                              >
                                {savingCoverProjectId === project.id
                                  ? "Entferne..."
                                  : "Cover entfernen"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {editingProjectId === project.id ? (
                          <form
                            className={styles.projectForm}
                            onSubmit={(event) =>
                              handleUpdateProject(event, project.id)
                            }
                          >
                            <div className={styles.fieldGroup}>
                              <label htmlFor={`edit-title-${project.id}`}>
                                Titel *
                              </label>
                              <input
                                id={`edit-title-${project.id}`}
                                name="title"
                                type="text"
                                value={editProjectForm.title}
                                onChange={handleEditProjectChange}
                                placeholder="Titel des Projekts"
                                required
                              />
                            </div>

                            <div className={styles.fieldGroup}>
                              <label htmlFor={`edit-subtitle-${project.id}`}>
                                Untertitel
                              </label>
                              <input
                                id={`edit-subtitle-${project.id}`}
                                name="subtitle"
                                type="text"
                                value={editProjectForm.subtitle}
                                onChange={handleEditProjectChange}
                                placeholder="Zusätzliche Projektzeile"
                              />
                            </div>

                            <div className={styles.fieldGroup}>
                              <label htmlFor={`edit-excerpt-${project.id}`}>
                                Kurzbeschreibung
                              </label>
                              <textarea
                                id={`edit-excerpt-${project.id}`}
                                name="excerpt"
                                value={editProjectForm.excerpt}
                                onChange={handleEditProjectChange}
                                placeholder="Kurze Projektbeschreibung"
                              />
                            </div>

                            <div className={styles.fieldGroup}>
                              <label htmlFor={`edit-slug-${project.id}`}>Slug</label>
                              <input
                                id={`edit-slug-${project.id}`}
                                name="slug"
                                type="text"
                                value={editProjectForm.slug}
                                onChange={handleEditProjectChange}
                                placeholder="portfolio-projekt"
                              />
                            </div>

                            <div className={styles.fieldGroup}>
                              <label htmlFor={`edit-displayOrder-${project.id}`}>
                                Anzeige-Reihenfolge
                              </label>
                              <input
                                id={`edit-displayOrder-${project.id}`}
                                name="displayOrder"
                                type="number"
                                min={0}
                                value={editProjectForm.displayOrder}
                                onChange={(event) =>
                                  setEditProjectForm((previous) => ({
                                    ...previous,
                                    displayOrder: Number(event.target.value) || 0,
                                  }))
                                }
                                placeholder="Z. B. 1"
                              />
                            </div>

                            <label
                              className={styles.checkboxRow}
                              htmlFor={`edit-isFeatured-${project.id}`}
                            >
                              <input
                                id={`edit-isFeatured-${project.id}`}
                                name="isFeatured"
                                type="checkbox"
                                checked={editProjectForm.isFeatured}
                                onChange={handleEditProjectChange}
                              />
                              Highlight-Projekt
                            </label>

                            <div className={styles.formActions}>
                              <button
                                type="submit"
                                className="adminButton"
                                disabled={updatingProjectId === project.id}
                              >
                                {updatingProjectId === project.id
                                  ? "Speichere..."
                                  : "Änderungen übernehmen"}
                              </button>
                              <button
                                type="button"
                                className="adminButton"
                                onClick={cancelEditing}
                              >
                                Abbrechen
                              </button>
                            </div>
                          </form>
                        ) : null}

                        <div className={styles.gallerySection}>
                          <h5>Projektfotos</h5>
                          {projectGallery.length === 0 ? (
                            <p className={styles.emptyState}>
                              Noch keine Projektfotos hochgeladen.
                            </p>
                          ) : (
                            <div className={styles.galleryList}>
                              {projectGallery.map((image) => {
                                const isCover =
                                  project.cover_public_url === image.public_url;

                                return (
                                  <div
                                    key={image.id}
                                    className={`${styles.galleryItem} ${
                                      isCover ? styles.galleryItemCover : ""
                                    }`}
                                  >
                                    <div className={styles.galleryImageWrapper}>
                                      <Image
                                        src={image.public_url}
                                        alt={image.caption || project.title}
                                        width={200}
                                        height={140}
                                        className={styles.galleryImage}
                                      />
                                      {isCover ? (
                                        <span className={styles.coverBadge}>
                                          Aktuelles Cover
                                        </span>
                                      ) : null}
                                    </div>
                                    <input
                                      type="text"
                                      value={imageCaptions[image.id] ?? ""}
                                      onChange={(event) =>
                                        handleGalleryCaptionChange(
                                          image.id,
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Bildbeschreibung"
                                    />
                                    <div className={styles.galleryActions}>
                                      <button
                                        type="button"
                                        className="adminButton"
                                        onClick={() =>
                                          handleSelectCoverFromGallery(project, image)
                                        }
                                        disabled={savingCoverProjectId === project.id}
                                      >
                                        {savingCoverProjectId === project.id
                                          ? "Speichere..."
                                          : isCover
                                          ? "Als Cover gesetzt"
                                          : "Als Cover wählen"}
                                      </button>
                                      <button
                                        type="button"
                                        className="adminButton"
                                        onClick={() => handleGalleryCaptionSave(image)}
                                        disabled={savingCaptionId === image.id}
                                      >
                                        {savingCaptionId === image.id
                                          ? "Speichere..."
                                          : "Beschreibung speichern"}
                                      </button>
                                      <button
                                        type="button"
                                        className="adminButton"
                                        onClick={() => handleGalleryImageDelete(image)}
                                        disabled={deletingImageId === image.id}
                                      >
                                        {deletingImageId === image.id
                                          ? "Lösche..."
                                          : "Bild löschen"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <form
                            className="admin-form"
                            onSubmit={(event) => handleGalleryUpload(event, project)}
                          >
                            <label className="admin-file-input">
                              <span>Datei wählen</span>
                              <input
                                key={fileInputResetKeys[project.id] ?? 0}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(event) => {
                                  const files = event.target.files
                                    ? Array.from(event.target.files)
                                    : [];
                                  handleGallerySelection(project.id, files);
                                }}
                              />
                            </label>
                            <button
                              type="submit"
                              className="adminButton"
                              disabled={uploadingImageProjectId === project.id}
                            >
                              {uploadingImageProjectId === project.id
                                ? "Lade hoch..."
                                : "Projektfoto hinzufügen"}
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
