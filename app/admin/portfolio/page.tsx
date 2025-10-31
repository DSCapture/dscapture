"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "../page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminPortfolioPage() {
  const { loading } = useVerifyAdminAccess();

  if (loading) {
    return (
      <div className={styles.adminPage}>
        <AdminSidebar />
        <div className={styles.adminContent}>Überprüfung läuft...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <AdminSidebar />
      <div className={styles.adminContent}>
        <h1>Portfolio Manager</h1>
        <p>Pflege hier Projekte und Referenzen für das Portfolio.</p>
      </div>
    </div>
  );
}
