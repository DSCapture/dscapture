"use client";

import AdminSidebar from "../adminComponents/adminSidebar/AdminSidebar";
import { useVerifyAdminAccess } from "@/lib/verifyAdminAccess";

export default function AdminPortfolioPage() {
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
        <h1>Portfolio Manager</h1>
        <p>Pflege hier Projekte und Referenzen für das Portfolio.</p>
      </div>
    </div>
  );
}
