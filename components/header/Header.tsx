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

type SocialLink = {
  href: string;
  label: string;
  icon: string;
};

const NAV_LINKS: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/kontakt", label: "Kontakt" },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://www.instagram.com/ds_capture_portraits/",
    label: "Instagram",
    icon: "bi-instagram",
  },
  {
    href: "https://www.linkedin.com/in/dawid-chmielewski-860308209/",
    label: "LinkedIn",
    icon: "bi-linkedin",
  },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHomeHeaderHidden, setIsHomeHeaderHidden] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/" || pathname === null;

  useEffect(() => {
    if (!isHome) {
      setIsHomeHeaderHidden(false);
      return;
    }

    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16"
    );
    const hideThreshold = rootFontSize * 3;

    const updateVisibility = () => {
      const scrollY = window.scrollY;

      if (scrollY === 0) {
        setIsHomeHeaderHidden((current) => (current ? false : current));
        return;
      }

      if (scrollY > hideThreshold) {
        setIsHomeHeaderHidden((current) => (current ? current : true));
      }
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [isHome]);
  const navLinkClassName = useMemo(
    () =>
      [styles.headerNavLink, isHome ? styles.headerNavLinkHome : null]
        .filter(Boolean)
        .join(" "),
    [isHome]
  );

  if (pathname?.startsWith("/asdf")) {
    return null;
  }

  const headerClassName = [
    styles.mainHeader,
    isHome ? styles.mainHeaderHome : styles.mainHeaderDefault,
    isMenuOpen ? styles.headerExpanded : null,
    isHome && isHomeHeaderHidden ? styles.mainHeaderHidden : null,
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
            {SOCIAL_LINKS.map((link) => (
              <Link
                key={link.href}
                className={styles.socialMediaLink}
                href={link.href}
                aria-label={link.label}
              >
                <i className={`bi ${link.icon}`} aria-hidden />
                <span className={styles.visuallyHidden}>{link.label}</span>
              </Link>
            ))}
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
            {SOCIAL_LINKS.map((link) => (
              <Link
                key={link.href}
                className={styles.mobileSocialLink}
                href={link.href}
                aria-label={link.label}
              >
                <i className={`bi ${link.icon}`} aria-hidden />
                <span className={styles.visuallyHidden}>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
