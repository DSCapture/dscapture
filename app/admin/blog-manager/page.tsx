"use client";

import Link from "next/link";
import { useVerifyAdminAccess } from "../../../lib/verifyAdminAccess";
import styles from "./page.module.css";
import "../adminComponents/adminPageHader.css";

export default function BlogManager() {
  const { loading } = useVerifyAdminAccess();

  if (loading) {
    return <div className={styles.blogManagerContent}>Überprüfung läuft...</div>;
  }

  return (
    <div className={styles.blogManagerContent}>
      <header className="adminPageHeader">
        <h1>Blog Manager</h1>
        <Link
          className={styles.newBlogButton}
          href="/admin/blog-manager/neuer-artikel"
        >
          <i className="bi bi-plus-circle"></i> Neuer Artikel
        </Link>
      </header>
    </div>
  );
}
