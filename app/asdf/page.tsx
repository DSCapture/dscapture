"use client";

import { useVerifyAdminAccess } from "../../lib/verifyAdminAccess";
import AdminSidebar from "./adminComponents/adminSidebar/AdminSidebar";

export default function AdminPage() {
  // 👇 führt clientseitig den Zugriffsschutz aus
  const { loading, adminUser } = useVerifyAdminAccess();

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
        <h1>Adminbereich</h1>
        <p>Willkommen, {adminUser?.email}</p>
        <p>Rolle: {adminUser?.role}</p>
      </div>
    </div>
  );
}
