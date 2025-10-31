"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminHomepagePage() {
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
        <h1>Homepage Verwaltung</h1>
        <p>Verwalte hier die Inhalte der öffentlichen Startseite.</p>
      </div>
    </div>
  );
}
