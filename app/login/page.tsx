"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Cookies from "js-cookie";

import styles from "./page.module.css";
import { supabase } from "../../lib/supabaseClient";
import { logUserAction } from "@/lib/logger";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const forgotPasswordHref = useMemo(() => {
    if (!email) {
      return "/login/passwort-vergessen";
    }

    return `/login/passwort-vergessen?email=${encodeURIComponent(email)}`;
  }, [email]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(`Login fehlgeschlagen: ${error.message}`);
      await logUserAction({
        action: "login_failed",
        context: "public",
        userEmail: email,
        description: "Fehlgeschlagener Login-Versuch.",
        metadata: { reason: error.message },
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      Cookies.set("userId", data.user.id, { expires: 7 });

      const { data: adminUser, error: clientError } = await supabase
        .from("adminUsers")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (clientError) {
        console.error("Fehler beim Laden der Client-Daten:", clientError.message);
        await logUserAction({
          action: "load_admin_role_failed",
          context: "admin",
          userId: data.user.id,
          userEmail: data.user.email ?? email,
          metadata: { error: clientError.message },
        });
      }

      if (!adminUser) {
        console.warn("Kein Admin-Eintrag für diesen Benutzer gefunden.");
        await logUserAction({
          action: "admin_role_missing",
          context: "admin",
          userId: data.user.id,
          userEmail: data.user.email ?? email,
        });
      }

      if (adminUser?.role) {
        Cookies.set("role", adminUser.role, { expires: 7 });
      }

      await logUserAction({
        action: "login_success",
        context: adminUser ? "admin" : "public",
        userId: data.user.id,
        userEmail: data.user.email ?? email,
        metadata: { role: adminUser?.role ?? null },
      });

      router.push("/asdf");
    }

    setLoading(false);
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.heading}>
          <h1>Einloggen</h1>
          <p>
            Melde dich mit deinen Zugangsdaten an, um auf den geschützten Bereich
            zuzugreifen.
          </p>
        </div>

        {errorMessage && (
          <p className={styles.errorMessage} role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        )}

        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className={styles.inputControl}>
            <label className={styles.inputLabel} htmlFor="email">
              E-Mail-Adresse
            </label>
            <div className={styles.inputFieldWrapper}>
              <i className={`bi bi-envelope ${styles.inputIcon}`} aria-hidden="true" />
              <input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                className={styles.inputField}
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputControl}>
            <label className={styles.inputLabel} htmlFor="password">
              Passwort
            </label>
            <div className={styles.inputFieldWrapper}>
              <i className={`bi bi-shield-lock ${styles.inputIcon}`} aria-hidden="true" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className={styles.inputField}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} primaryButton`}
            disabled={loading}
          >
            {loading ? "Einloggen..." : (
              <>
                Einloggen <i className="bi bi-arrow-right" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className={styles.formFooter}>
          <Link href={forgotPasswordHref} className={styles.forgotPasswordLink}>
            Passwort vergessen?
          </Link>
        </div>
      </div>
    </div>
  );
}
