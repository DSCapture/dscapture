"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import styles from "../page.module.css";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminContactPage() {
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
        <h1>Kontaktanfragen</h1>
        <p>Behalte den Überblick über neue Nachrichten und beantworte Anfragen.</p>
      </div>
    </div>
  );
}
