"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      setFeedback(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    const { error: insertError } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      phone: phone.trim() || null,
      message: message.trim(),
    });

    setIsSubmitting(false);

    if (insertError) {
      setError("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
      return;
    }

    setFeedback("Danke für deine Nachricht! Wir melden uns zeitnah bei dir.");
    setName("");
    setEmail("");
    setSubject("");
    setPhone("");
    setMessage("");
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Kontaktiere uns</h1>
          <p>
            Wir freuen uns über dein Interesse an DS_Capture. Teile uns dein Anliegen mit und wir
            melden uns schnellstmöglich bei dir.
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <form className={styles.form} onSubmit={handleSubmit}>
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

          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
          </button>

          {feedback && <p className={styles.feedback}>{feedback}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </form>

        <aside className={styles.sidebar}>
          <h2>Direkter Kontakt</h2>
          <p>
            Lieber ein persönliches Gespräch? Schreibe uns eine E-Mail an
            <a href="mailto:hello@dscapture.de"> hello@dscapture.de</a> oder ruf uns an unter
            <a href="tel:+4900000000"> +49 000 0000</a>.
          </p>
          <p>
            Wir sind von Montag bis Freitag zwischen 9 und 18 Uhr für dich erreichbar.
          </p>
        </aside>
      </section>
    </main>
  );
}
