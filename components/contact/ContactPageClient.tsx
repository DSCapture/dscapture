"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logUserAction } from "@/lib/logger";
import { sendContactNotification } from "@/lib/email/sendContactNotification";
import styles from "@/app/kontakt/contact.module.css";

const ContactPageClient = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      setFeedback(null);
      return;
    }

    if (!hasAcceptedPrivacy) {
      setError("Bitte akzeptiere die Datenschutzbestimmungen.");
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject || null,
      phone: trimmedPhone || null,
      message: trimmedMessage,
    });

    if (insertError) {
      setIsSubmitting(false);
      setError("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
      await logUserAction({
        action: "contact_message_failed",
        context: "public",
        userEmail: trimmedEmail,
        description: "Kontaktformular konnte nicht gespeichert werden.",
        metadata: {
          error: insertError.message,
          hasSubject: Boolean(trimmedSubject),
          hasPhone: Boolean(trimmedPhone),
        },
      });
      return;
    }

    await logUserAction({
      action: "contact_message_submitted",
      context: "public",
      userEmail: trimmedEmail,
      description: "Kontaktformular wurde erfolgreich abgesendet.",
      metadata: {
        hasSubject: Boolean(trimmedSubject),
        hasPhone: Boolean(trimmedPhone),
      },
    });

    try {
      await sendContactNotification({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        phone: trimmedPhone,
        message: trimmedMessage,
        hasAcceptedPrivacy,
        submittedAt: new Date().toISOString(),
      });
    } catch (notificationError) {
      console.error("Fehler beim Versenden der Kontaktbenachrichtigung:", notificationError);
      await logUserAction({
        action: "contact_notification_failed",
        context: "public",
        userEmail: trimmedEmail,
        description: "Kontaktformular wurde gespeichert, aber die E-Mail-Benachrichtigung ist fehlgeschlagen.",
        metadata: {
          error:
            notificationError instanceof Error ? notificationError.message : String(notificationError),
          hasSubject: Boolean(trimmedSubject),
          hasPhone: Boolean(trimmedPhone),
        },
      });
      setIsSubmitting(false);
      setError(
        "Deine Nachricht wurde gespeichert, aber die E-Mail-Benachrichtigung konnte nicht versendet werden. Bitte kontaktiere uns direkt per E-Mail.",
      );
      return;
    }

    setIsSubmitting(false);

    setFeedback("Danke für deine Nachricht! Wir melden uns zeitnah bei dir.");
    setName("");
    setEmail("");
    setSubject("");
    setPhone("");
    setMessage("");
    setHasAcceptedPrivacy(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Kontaktiere uns</h1>
          <p>
            Wir freuen uns über dein Interesse an DS_Capture. Teile uns dein Anliegen mit und wir melden uns
            schnellstmöglich bei dir.
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <h2>Schreib uns eine Nachricht</h2>
            <p>
              Erzähl uns mehr über dein Projekt oder stelle deine Fragen. Wir nehmen innerhalb eines Werktages
              Kontakt zu dir auf.
            </p>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="name">Name*</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Max Mustermann"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phone">Telefon</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Optional: +49 123 456789"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="email">E-Mail*</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="max@beispiel.de"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="subject">Betreff</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Worum geht es?"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="message">Nachricht*</label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Erzähl uns mehr über dein Projekt..."
              rows={6}
              required
            />
          </div>

          <div className={styles.privacyField}>
            <label className={styles.privacyLabel}>
              <input
                type="checkbox"
                checked={hasAcceptedPrivacy}
                onChange={(event) => setHasAcceptedPrivacy(event.target.checked)}
              />
              <span>
                Ich habe die
                {" "}
                <a href="/datenschutz" target="_blank" rel="noopener noreferrer">
                  Datenschutzbestimmungen
                </a>
                {" "}
                gelesen und akzeptiere sie.
              </span>
            </label>
          </div>

          <div className={styles.formFooter}>
            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
            </button>
            <span>Wir melden uns in der Regel innerhalb von 24 Stunden.</span>
          </div>

          {feedback && (
            <p className={styles.feedback} role="status" aria-live="polite">
              {feedback}
            </p>
          )}
          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}
        </form>

        <aside className={styles.sidebar}>
          <h2>Direkter Kontakt</h2>
          <p>Lieber ein persönliches Gespräch? Du erreichst uns über die folgenden Kanäle:</p>
          <ul className={styles.contactList}>
            <li>
              <span>E-Mail</span>
              <a href="mailto:fotografie@ds-capture.de">fotografie@ds-capture.de</a>
            </li>
            <li>
              <span>Telefon</span>
              <a href="tel:+491724374609">0172 4374609</a>
            </li>
          </ul>
          <p className={styles.officeHours}>Wir sind montags bis freitags von 9 bis 18 Uhr für dich da.</p>
        </aside>
      </section>
    </main>
  );
};

export default ContactPageClient;
