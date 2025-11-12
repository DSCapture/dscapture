"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./header.module.css";

type NavigationLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/" || pathname === null;
  const navLinkClassName = useMemo(
    () =>
      [styles.headerNavLink, isHome ? styles.headerNavLinkHome : null]
        .filter(Boolean)
        .join(" "),
    [isHome]
  );

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const headerClassName = [
    styles.mainHeader,
    isHome ? styles.mainHeaderHome : styles.mainHeaderDefault,
    isMenuOpen ? styles.headerExpanded : null,
  ]
    .filter(Boolean)
    .join(" ");

  const logoSrc = isHome ? "/logo_white.webp" : "/logo_blue.webp";

  return (
    <header className={headerClassName}>
      <div className={styles.headerContent}>
        <Link className={styles.headerLogoLink} href="/">
          <Image src={logoSrc} height={34} width={43} alt="DS_Capture Logo" />
        </Link>

        <nav className={styles.headerNavigation}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className={navLinkClassName} href={link.href}>
              {link.label}
            </Link>
          ))}
          <div className={styles.socialMediaBox}>
            <Link
              className={styles.socialMediaLink}
              href="https://www.instagram.com/ds_capture_portraits/"
            >
              <i className="bi bi-instagram" />
            </Link>
            <Link
              className={styles.socialMediaLink}
              href="https://www.linkedin.com/in/dawid-chmielewski-860308209/"
            >
              <i className="bi bi-linkedin" />
            </Link>
          </div>
        </nav>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => {
            setIsMenuOpen(true);
          }}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Navigation geöffnet" : "Navigation öffnen"}
        >
          <span className={styles.menuIcon} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        className={[styles.mobileMenu, isMenuOpen ? styles.mobileMenuOpen : null]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          setIsMenuOpen(false);
        }}
        aria-hidden={!isMenuOpen}
      >
        <nav
          className={styles.mobileMenuContent}
          aria-label="Mobile Navigation"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div className={styles.mobileMenuHeader}>
            <button
              type="button"
              className={styles.mobileMenuCloseButton}
              onClick={() => {
                setIsMenuOpen(false);
              }}
              aria-label="Navigation schließen"
            >
              <span className={styles.mobileMenuCloseIcon} aria-hidden />
            </button>
          </div>
          <div className={styles.mobileNavLinks}>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} className={navLinkClassName} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.mobileSocials}>
            <Link
              className={styles.mobileSocialLink}
              href="https://www.instagram.com/ds_capture_portraits/"
            >
              Instagram
            </Link>
            <Link
              className={styles.mobileSocialLink}
              href="https://www.linkedin.com/in/dawid-chmielewski-860308209/"
            >
              LinkedIn
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
