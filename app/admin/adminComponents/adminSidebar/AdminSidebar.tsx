"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logoutButton/LogoutButton";
import styles from "./adminSidebar.module.css";
import { supabase } from "@/lib/supabaseClient";

type NavigationMatch = (currentPath: string) => boolean;

type NavigationLinkItem = {
    href: string;
    icon: string;
    label: string;
    matchPath?: NavigationMatch;
};

type NavigationItem =
    | ({ type: "link" } & NavigationLinkItem)
    | {
          type: "group";
          id: string;
          icon: string;
          label: string;
          items: NavigationLinkItem[];
      };

const AdminSidebar = () => {
    const [pendingContacts, setPendingContacts] = useState<number | null>(null);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchPendingContacts = useCallback(async () => {
        const { count, error } = await supabase
            .from("contact_messages")
            .select("id", { count: "exact", head: true })
            .or("status.is.null,status.eq.open,status.eq.in_progress");

        if (error) {
            console.error("Fehler beim Laden der offenen Kontaktanfragen:", error);
            return null;
        }

        return count ?? 0;
    }, []);

    useEffect(() => {
        let active = true;

        const updatePendingContacts = async () => {
            const count = await fetchPendingContacts();
            if (active && count !== null) {
                setPendingContacts(count);
            }
        };

        void updatePendingContacts();

        const channel = supabase
            .channel("contact-messages-sidebar")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "contact_messages" },
                () => {
                    void updatePendingContacts();
                },
            )
            .subscribe();

        return () => {
            active = false;
            void channel.unsubscribe();
        };
    }, [fetchPendingContacts]);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 900;
            setIsMobileViewport(isMobile);

            if (!isMobile) {
                setIsMobileMenuOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    const pathname = usePathname();
    const navigationItems = useMemo<NavigationItem[]>(
        () => [
            {
                type: "link",
                href: "/admin",
                icon: "bi-speedometer2",
                label: "Dashboard",
                matchPath: (currentPath: string) => currentPath === "/admin",
            },
            {
                type: "group",
                id: "homepage",
                icon: "bi-house",
                label: "Homepage",
                items: [
                    {
                        href: "/admin/homepage",
                        icon: "bi-image",
                        label: "Homepage Hero Manager",
                    },
                    {
                        href: "/admin/homepage/usps",
                        icon: "bi-stars",
                        label: "Homepage USP-Punkte",
                        matchPath: (currentPath: string) =>
                            currentPath.startsWith("/admin/homepage/usps"),
                    },
                    {
                        href: "/admin/homepage/benefits",
                        icon: "bi-gift",
                        label: "Homepage Benefits",
                        matchPath: (currentPath: string) =>
                            currentPath.startsWith("/admin/homepage/benefits"),
                    },
                    {
                        href: "/admin/photographer-intro",
                        icon: "bi-person-badge",
                        label: "Fotografenvorstellung",
                    },
                    {
                        href: "/admin/reviews",
                        icon: "bi-chat-quote",
                        label: "Rezensionen",
                    },
                ],
            },
            {
                type: "link",
                href: "/admin/portfolio",
                icon: "bi-columns-gap",
                label: "Portfolio Manager",
            },
            {
                type: "link",
                href: "/admin/blog",
                icon: "bi-card-text",
                label: "Blog Manager",
                matchPath: (currentPath: string) => currentPath.startsWith("/admin/blog"),
            },
            {
                type: "link",
                href: "/admin/metadata",
                icon: "bi-tags",
                label: "Metadaten",
            },
            {
                type: "link",
                href: "/admin/contact",
                icon: "bi-envelope",
                label: "Kontaktanfragen",
                matchPath: (currentPath: string) => currentPath.startsWith("/admin/contact"),
            },
            {
                type: "group",
                id: "development",
                icon: "bi-gear",
                label: "Development",
                items: [
                    {
                        href: "/admin/logs",
                        icon: "bi-clipboard-data",
                        label: "Aktivitäts Log",
                    },
                ],
            },
        ],
        [],
    );

    const shouldShowPendingBadge = useMemo(() => {
        const isContactPage = pathname.startsWith("/admin/contact");
        return !isContactPage && typeof pendingContacts === "number" && pendingContacts > 0;
    }, [pathname, pendingContacts]);

    const isItemActive = useCallback(
        (href: string, matchPath?: NavigationMatch) => {
            if (typeof matchPath === "function") {
                return matchPath(pathname);
            }

            return pathname === href;
        },
        [pathname],
    );

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setOpenGroups((previousState) => {
            const nextState = { ...previousState };
            let hasUpdates = false;

            navigationItems.forEach((item) => {
                if (item.type !== "group") {
                    return;
                }

                const hasActiveChild = item.items.some(({ href, matchPath }) =>
                    isItemActive(href, matchPath),
                );

                if (hasActiveChild && typeof nextState[item.id] === "undefined") {
                    nextState[item.id] = true;
                    hasUpdates = true;
                }
            });

            return hasUpdates ? nextState : previousState;
        });
    }, [navigationItems, isItemActive]);

    const handleNavigation = useCallback(() => {
        if (isMobileViewport) {
            setIsMobileMenuOpen(false);
        }
    }, [isMobileViewport]);

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((previousState) => !previousState);
    }, []);

    const handleToggleGroup = useCallback((groupId: string) => {
        setOpenGroups((previousState) => ({
            ...previousState,
            [groupId]: !previousState[groupId],
        }));
    }, []);

    const mobileToggleLabel = isMobileMenuOpen ? "Menü schließen" : "Menü öffnen";

    const sidebarClassNames = [styles.adminSidebar];

    if (isMobileViewport) {
        sidebarClassNames.push(styles.mobileSidebar);

        if (isMobileMenuOpen) {
            sidebarClassNames.push(styles.mobileSidebarOpen);
        }
    }

    return (
        <>
            {isMobileViewport ? (
                <button
                    type="button"
                    className={`${styles.mobileToggleButton} ${isMobileMenuOpen ? styles.mobileToggleButtonActive : ""}`.trim()}
                    onClick={handleToggleMobileMenu}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="admin-navigation"
                    aria-label={mobileToggleLabel}
                >
                    <i className={`bi ${isMobileMenuOpen ? "bi-x" : "bi-list"}`} aria-hidden="true"></i>
                    Menü
                </button>
            ) : null}
            {isMobileViewport && isMobileMenuOpen ? (
                <button
                    type="button"
                    className={styles.mobileBackdrop}
                    aria-label="Menü schließen"
                    onClick={handleToggleMobileMenu}
                />
            ) : null}
            <div className={sidebarClassNames.join(" ")}>
                <div className={styles.sidebarLogoBox}>
                    <h1 className={styles.sidebarHeadline}>Admin Panel</h1>
                </div>
                <nav className={styles.adminSidebarNavigation} id="admin-navigation">
                    {navigationItems.map((item) => {
                        if (item.type === "link") {
                            const isActive = isItemActive(item.href, item.matchPath);
                            const linkClassNames = [styles.adminNavLink];

                            if (isActive) {
                                linkClassNames.push(styles.adminNavLinkActive);
                            }

                            const isContactLink = item.href === "/admin/contact";

                            return (
                                <Link
                                    key={item.href}
                                    className={linkClassNames.join(" ")}
                                    href={item.href}
                                    onClick={handleNavigation}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                                    {isContactLink ? (
                                        <span className={styles.linkLabel}>
                                            {item.label}
                                            {shouldShowPendingBadge ? (
                                                <span
                                                    className={styles.pendingBadge}
                                                    aria-label={`${pendingContacts} Kontaktanfragen zu bearbeiten`}
                                                >
                                                    {pendingContacts}
                                                </span>
                                            ) : null}
                                        </span>
                                    ) : (
                                        item.label
                                    )}
                                </Link>
                            );
                        }

                        const isGroupOpen = openGroups[item.id] ?? false;
                        const hasActiveChild = item.items.some(({ href, matchPath }) =>
                            isItemActive(href, matchPath),
                        );
                        const triggerClassNames = [styles.adminNavLink, styles.adminNavLinkButton];

                        if (hasActiveChild) {
                            triggerClassNames.push(styles.adminNavLinkActive);
                        }

                        return (
                            <div key={item.id} className={styles.adminAccordion}>
                                <button
                                    type="button"
                                    className={triggerClassNames.join(" ")}
                                    onClick={() => handleToggleGroup(item.id)}
                                    aria-expanded={isGroupOpen}
                                    aria-controls={`admin-accordion-${item.id}`}
                                >
                                    <span className={styles.adminAccordionLabel}>
                                        <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                                        {item.label}
                                    </span>
                                    <i
                                        className={`bi ${
                                            isGroupOpen ? "bi-chevron-up" : "bi-chevron-down"
                                        } ${styles.adminAccordionCaret} ${
                                            isGroupOpen ? styles.adminAccordionCaretOpen : ""
                                        }`.trim()}
                                        aria-hidden="true"
                                    ></i>
                                </button>
                                <div
                                    id={`admin-accordion-${item.id}`}
                                    className={`${styles.adminAccordionPanel} ${
                                        isGroupOpen ? styles.adminAccordionPanelOpen : ""
                                    }`.trim()}
                                    hidden={!isGroupOpen}
                                    aria-hidden={!isGroupOpen}
                                >
                                    {item.items.map(({ href, icon, label, matchPath }) => {
                                        const isActive = isItemActive(href, matchPath);
                                        const subLinkClassNames = [
                                            styles.adminNavLink,
                                            styles.adminSubNavLink,
                                        ];

                                        if (isActive) {
                                            subLinkClassNames.push(styles.adminNavLinkActive);
                                        }

                                        return (
                                            <Link
                                                key={href}
                                                className={subLinkClassNames.join(" ")}
                                                href={href}
                                                onClick={handleNavigation}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <i className={`bi ${icon}`} aria-hidden="true"></i>
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {isMobileViewport ? (
                        <div className={styles.mobileLogoutBox} onClick={handleNavigation}>
                            <LogoutButton />
                        </div>
                    ) : null}
                </nav>
                {!isMobileViewport ? (
                    <div className={styles.logoutBox} onClick={handleNavigation}>
                        <LogoutButton />
                    </div>
                ) : null}
            </div>
        </>
    );
};

export default AdminSidebar;
