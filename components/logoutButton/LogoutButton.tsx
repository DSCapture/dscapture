"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { supabase } from "../../lib/supabaseClient";
import { useState } from "react";
import styles from "./logoutButton.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      await supabase.auth.signOut();

      Cookies.remove("userId");
      Cookies.remove("role");

      await new Promise((res) => setTimeout(res, 300));

      router.replace("/");
    } catch (error) {
      console.error("Logout fehlgeschlagen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={styles.logoutButton}
    >
      {loading ? (
        "Wird abgemeldet..."
      ) : (
        <>
          <i className="bi bi-box-arrow-right"></i>
          Ausloggen
        </>
      )}
    </button>
  );
}
