import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Services | DS_Capture",
  description: "Überblick über die Services von DS_Capture.",
};

export default function ServicesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1>Unsere Services</h1>
      </div>
    </main>
  );
}
