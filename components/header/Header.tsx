import Image from "next/image";
import Link from "next/link";
import styles from "./header.module.css";

export default function Header() {
    return(
        <header className={styles.mainHeader}>
            <div className={styles.headerContent}>
                <Link className={styles.headerLogoLink} href="/">
                    <Image src="/ds_capture_logo_white.webp" height={45} width={45} alt="DS_Capture Logo"></Image>
                </Link>

                <nav className={styles.headerNavigation}>
                    <Link className={styles.headerNavLink} href="/">Home</Link>
                    <Link className={styles.headerNavLink} href="/portfolio">Portfolio</Link>
                    <Link className={styles.headerNavLink} href="/blog">Blog</Link>
                    <Link className={styles.headerNavLink} href="/kontakt">Kontakt</Link>
                </nav>
            </div>
        </header>
    );
}