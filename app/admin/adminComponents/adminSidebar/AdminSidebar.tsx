"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logoutButton/LogoutButton";
import styles from "./adminSidebar.module.css";
import { supabase } from "@/lib/supabaseClient";

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
    const navigationItems = useMemo(
        () => [
            {
                href: "/admin",
                icon: "bi-speedometer2",
                label: "Admin Dashboard",
                matchPath: (currentPath: string) => currentPath === "/admin",
            },
            {
                href: "/admin/homepage",
                icon: "bi-house",
                label: "Homepage",
            },
            {
                href: "/admin/reviews",
                icon: "bi-chat-quote",
                label: "Rezensionen",
            },
            {
                href: "/admin/portfolio",
                icon: "bi-columns-gap",
                label: "Portfolio Manager",
            },
            {
                href: "/admin/blog",
                icon: "bi-card-text",
                label: "Blog Manager",
                matchPath: (currentPath: string) => currentPath.startsWith("/admin/blog"),
            },
            {
                href: "/admin/metadata",
                icon: "bi-tags",
                label: "Metadaten",
            },
            {
                href: "/admin/logs",
                icon: "bi-clipboard-data",
                label: "Aktivitätslogs",
            },
        ],
        [],
    );

    const shouldShowPendingBadge = useMemo(() => {
        const isContactPage = pathname.startsWith("/admin/contact");
        return !isContactPage && typeof pendingContacts === "number" && pendingContacts > 0;
    }, [pathname, pendingContacts]);

    const isItemActive = useCallback(
        (href: string, matchPath?: (currentPath: string) => boolean) => {
            if (typeof matchPath === "function") {
                return matchPath(pathname);
            }

            return pathname === href;
        },
        [pathname],
    );

    const isContactActive = isItemActive(
        "/admin/contact",
        (currentPath) => currentPath.startsWith("/admin/contact"),
    );

    const contactClassNames = useMemo(() => {
        const classNames = [styles.adminNavLink];

        if (isContactActive) {
            classNames.push(styles.adminNavLinkActive);
        }

        return classNames;
    }, [isContactActive]);

    const handleNavigation = useCallback(() => {
        if (isMobileViewport) {
            setIsMobileMenuOpen(false);
        }
    }, [isMobileViewport]);

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((previousState) => !previousState);
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
                    {navigationItems.map(({ href, icon, label, matchPath }) => {
                        const isActive = isItemActive(href, matchPath);
                        const linkClassNames = [styles.adminNavLink];

                        if (isActive) {
                            linkClassNames.push(styles.adminNavLinkActive);
                        }

                        return (
                            <Link
                                key={href}
                                className={linkClassNames.join(" ")}
                                href={href}
                                onClick={handleNavigation}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <i className={`bi ${icon}`} aria-hidden="true"></i>
                                {label}
                            </Link>
                        );
                    })}
                    <Link
                        className={contactClassNames.join(" ")}
                        href="/admin/contact"
                        onClick={handleNavigation}
                        aria-current={isContactActive ? "page" : undefined}
                    >
                        <i className="bi bi-envelope" aria-hidden="true"></i>
                        <span className={styles.linkLabel}>
                            Kontaktanfragen
                            {shouldShowPendingBadge ? (
                                <span
                                    className={styles.pendingBadge}
                                    aria-label={`${pendingContacts} Kontaktanfragen zu bearbeiten`}
                                >
                                    {pendingContacts}
                                </span>
                            ) : null}
                        </span>
                    </Link>
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
