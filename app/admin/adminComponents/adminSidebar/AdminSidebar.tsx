import Link from "next/link";
import LogoutButton from "@/components/logoutButton/LogoutButton";
import styles from "./adminSidebar.module.css";

const AdminSidebar = () => {
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
                <Link className={styles.adminNavLink} href="/admin/contact">
                    <i className="bi bi-envelope"></i>
                    Kontaktanfragen
                </Link>
            </nav>
            <div className={styles.logoutBox}>
                <LogoutButton />
            </div>
        </div>
    );
};

export default AdminSidebar;
