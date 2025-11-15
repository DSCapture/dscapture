"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./footer.module.css";
import { useCookieConsentContext } from "@/components/cookieConsent/CookieConsentProvider";

const sitemapLinks = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/ds_capture_portraits/",
    label: "Instagram",
  },
  {
    href: "https://www.linkedin.com/in/dawid-chmielewski-860308209/",
    label: "LinkedIn",
  },
];

export default function Footer() {
  const pathname = usePathname();
  const cookieConsent = useCookieConsentContext();
  const openPreferences = cookieConsent?.openPreferences;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.branding}>
          <Link className={styles.logoLink} href="/" aria-label="Zur Startseite">
            <Image src="/logo_white.webp" width={100} height={80} alt="DS_Capture Logo" />
          </Link>
          <p className={styles.brandingText}>
            DS_Capture – urbane, ästhetische Bildwelten mit Fokus auf authentische
            Street- und Eventfotografie.
          </p>
        </div>

        <div className={styles.navigationGroup}>
          <h2 className={styles.groupTitle}>Sitemap</h2>
          <nav className={styles.linkList} aria-label="Sitemap">
            {sitemapLinks.map((link) => (
              <Link key={link.href} className={styles.link} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.navigationGroup}>
          <h2 className={styles.groupTitle}>Rechtliches</h2>
          <nav className={styles.linkList} aria-label="Rechtliche Hinweise">
            {legalLinks.map((link) => (
              <Link key={link.href} className={styles.link} href={link.href}>
                {link.label}
              </Link>
            ))}
            {openPreferences && (
              <button
                type="button"
                className={styles.preferencesButton}
                onClick={openPreferences}
              >
                Cookie-Einstellungen
              </button>
            )}
          </nav>
        </div>

        <div className={styles.navigationGroup}>
          <h2 className={styles.groupTitle}>Kontakt</h2>
          <nav className={styles.linkList} aria-label="Kontakt">
            <Link className={styles.link} href="/kontakt">
              Kontaktformular
            </Link>
            <div className={styles.socialLinks}>
              {socialLinks.map((link) => (
                <Link key={link.href} className={styles.socialLink} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} DS_Capture. Alle Rechte vorbehalten.
        </p>
        <div className={styles.bottomBarRight}>
          <p className={styles.createdByText}>
            Designed & Developed by <Link className={styles.flowefyLink} href="https://flowefy.de">flowefy.</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
