"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { supabase } from "../../lib/supabaseClient";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      // 🔹 Supabase-Session beenden
      await supabase.auth.signOut();

      // 🔹 Cookies löschen
      Cookies.remove("userId");
      Cookies.remove("role");

      // 🔹 Optional: kurze Verzögerung für bessere UX
      await new Promise((res) => setTimeout(res, 300));

      // 🔹 Weiterleitung zur Login-Seite
      router.replace("/login");
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
      className={`px-4 py-2 rounded-md text-white font-medium transition-all ${
        loading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {loading ? "Wird abgemeldet..." : "Logout"}
    </button>
  );
}
