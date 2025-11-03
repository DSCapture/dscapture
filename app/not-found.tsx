import Link from "next/link";

import styles from "./login/page.module.css";
import notFoundStyles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.heading}>
          <h1>404 – Seite nicht gefunden</h1>
          <p>
            Entschuldigung, die angeforderte Seite existiert nicht oder wurde
            verschoben.
          </p>
        </div>

        <div className={notFoundStyles.content}>
          <div className={notFoundStyles.message}>
            <span className={notFoundStyles.statusBadge}>404</span>
            <p>
              Prüfe die eingegebene Adresse oder nutze die folgenden Aktionen,
              um weiterzumachen.
            </p>
          </div>

          <div className={notFoundStyles.actions}>
            <Link
              href="/"
              className={`${styles.submitButton} primaryButton ${notFoundStyles.primaryLink}`}
            >
              Zur Startseite
            </Link>
            <Link href="/kontakt" className={notFoundStyles.secondaryLink}>
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
