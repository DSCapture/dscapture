"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logoutButton/LogoutButton";
import styles from "./adminSidebar.module.css";
import { supabase } from "@/lib/supabaseClient";

const AdminSidebar = () => {
    const [pendingContacts, setPendingContacts] = useState<number | null>(null);

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

    const pathname = usePathname();
    const shouldShowPendingBadge = useMemo(() => {
        const isContactPage = pathname === "/admin/contact";
        return !isContactPage && typeof pendingContacts === "number" && pendingContacts > 0;
    }, [pathname, pendingContacts]);

    return (
        <div className={styles.adminSidebar}>
            <div className={styles.sidebarLogoBox}>
                <h1 className={styles.sidebarHeadline}>Admin Panel</h1>
            </div>
            <nav className={styles.adminSidebarNavigation}>
                <Link className={styles.adminNavLink} href="/admin">
                    <i className="bi bi-speedometer2"></i>
                    Admin Dashboard
                </Link>
                <Link className={styles.adminNavLink} href="/admin/homepage">
                    <i className="bi bi-house"></i>
                    Homepage
                </Link>
                <Link className={styles.adminNavLink} href="/admin/portfolio">
                    <i className="bi bi-columns-gap"></i>
                    Portfolio Manager
                </Link>
                <Link className={styles.adminNavLink} href="/admin/blog">
                    <i className="bi bi-card-text"></i>
                    Blog Manager
                </Link>
                <Link className={styles.adminNavLink} href="/admin/metadata">
                    <i className="bi bi-tags"></i>
                    Metadaten
                </Link>
                <Link className={styles.adminNavLink} href="/admin/logs">
                    <i className="bi bi-clipboard-data"></i>
                    Aktivitätslogs
                </Link>
                <Link className={styles.adminNavLink} href="/admin/contact">
                    <i className="bi bi-envelope"></i>
                    <span className={styles.linkLabel}>
                        Kontaktanfragen
                        {shouldShowPendingBadge ? (
                            <span className={styles.pendingBadge} aria-label={`${pendingContacts} Kontaktanfragen zu bearbeiten`}>
                                {pendingContacts}
                            </span>
                        ) : null}
                    </span>
                </Link>
            </nav>
            <div className={styles.logoutBox}>
                <LogoutButton />
            </div>
        </div>
    );
};

export default AdminSidebar;
