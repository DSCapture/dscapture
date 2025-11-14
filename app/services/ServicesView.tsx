"use client";

import { useState } from "react";
import styles from "./page.module.css";

export type ServiceDefinition = {
  id: string;
  label: string;
  headline: string;
  subline: string;
  info: {
    title: string;
    paragraphs: readonly string[];
    bulletPoints: readonly string[];
  };
  gradient: readonly [string, string];
};

type ServicesViewProps = {
  services: readonly ServiceDefinition[];
};

export default function ServicesView({ services }: ServicesViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (services.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>Services</h1>
          <p>Aktuell stehen keine Services zur Verfügung.</p>
        </section>
      </main>
    );
  }

  const activeService = services[activeIndex];
  const offsetPercentage = (activeIndex / services.length) * 100;

  const handlePrev = () => {
    setActiveIndex((index) => (index === 0 ? services.length - 1 : index - 1));
  };

  const handleNext = () => {
    setActiveIndex((index) => (index === services.length - 1 ? 0 : index + 1));
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Service Highlights">
        <div className={styles.carousel}>
          <div
            className={styles.track}
            style={{ transform: `translateX(-${offsetPercentage}%)` }}
          >
            {services.map((service, index) => (
              <article
                key={service.id}
                className={styles.slide}
                aria-hidden={activeIndex !== index}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${service.gradient[0]}, ${service.gradient[1]})`,
                }}
              >
                <span className={styles.slideLabel}>{service.label}</span>
                <h1>{service.headline}</h1>
                <p>{service.subline}</p>
              </article>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.navButton} ${styles.prev}`}
            onClick={handlePrev}
            aria-label="Vorheriger Service"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.navButton} ${styles.next}`}
            onClick={handleNext}
            aria-label="Nächster Service"
          >
            ›
          </button>
          <div
            className={styles.pagination}
            role="tablist"
            aria-label="Service Auswahl"
          >
            {services.map((service, index) => (
              <button
                key={service.id}
                type="button"
                role="tab"
                aria-selected={activeIndex === index}
                aria-label={service.label}
                className={
                  activeIndex === index ? `${styles.dot} ${styles.dotActive}` : styles.dot
                }
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.info} aria-live="polite">
        <div className={styles.infoHeader}>
          <h2>{activeService.info.title}</h2>
          <p>{activeService.subline}</p>
        </div>
        <div className={styles.infoContent}>
          <div className={styles.infoText}>
            {activeService.info.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className={styles.infoList}>
            {activeService.info.bulletPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
