"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminContactPage() {
  const { loading } = useVerifyAdminAccess();

  if (loading) {
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
        <h1>Kontaktanfragen</h1>
        <p>Behalte den Überblick über neue Nachrichten und beantworte Anfragen.</p>
      </div>
    </div>
  );
}
