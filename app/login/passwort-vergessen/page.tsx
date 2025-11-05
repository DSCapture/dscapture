"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import styles from "./page.module.css";
import { supabase } from "../../../lib/supabaseClient";
import { logUserAction } from "@/lib/logger";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initialEmail = searchParams.get("email");
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setErrorMessage(error.message);
      await logUserAction({
        action: "password_reset_failed",
        context: "public",
        userEmail: email,
        metadata: { error: error.message },
      });
    } else {
      setSuccessMessage(
        "Wenn die angegebene E-Mail-Adresse registriert ist, senden wir dir einen Link zum Zurücksetzen deines Passworts."
      );
      await logUserAction({
        action: "password_reset_requested",
        context: "public",
        userEmail: email,
      });
    }

    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.heading}>
          <h1>Passwort vergessen?</h1>
          <p>
            Gib deine E-Mail-Adresse ein. Wenn sie mit einem Konto übereinstimmt,
            erhältst du eine Nachricht zum Zurücksetzen deines Passworts.
          </p>
        </div>

        {successMessage && (
          <p className={styles.success} role="status" aria-live="polite">
            {successMessage}
          </p>
        )}

        {errorMessage && (
          <p className={styles.error} role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputControl}>
            <label className={styles.inputLabel} htmlFor="forgot-password-email">
              E-Mail-Adresse
            </label>
            <div className={styles.inputFieldWrapper}>
              <i className={`bi bi-envelope ${styles.inputIcon}`} aria-hidden="true" />
              <input
                id="forgot-password-email"
                type="email"
                className={styles.inputField}
                placeholder="name@beispiel.de"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} primaryButton`}
            disabled={loading}
          >
            {loading ? "Sende Link..." : "Zurücksetzen anfordern"}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login" className={styles.backLink}>
            <i className="bi bi-arrow-left" aria-hidden="true" /> Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
