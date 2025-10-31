"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "../page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminHomepagePage() {
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
        <h1>Homepage Verwaltung</h1>
        <p>Verwalte hier die Inhalte der öffentlichen Startseite.</p>
      </div>
    </div>
  );
}
