"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./ServicesCarousel.module.css";

export type ServicePortfolioProject = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string | null;
  coverUrl: string | null;
};

export type ServiceDefinition = {
  id: string;
  label: string;
  headline: string;
  subline: string;
  paragraphs: readonly string[];
  infoTitle: string;
  bulletPoints: readonly string[];
  gradientStart: string;
  gradientEnd: string;
  portfolioProjects: readonly ServicePortfolioProject[];
  imageUrl: string;
};

type ServicesViewProps = {
  services: readonly ServiceDefinition[];
};

export default function ServicesView({ services }: ServicesViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (services.length === 0) {
      return;
    }

    if (activeIndex >= services.length) {
      setActiveIndex(Math.max(services.length - 1, 0));
    }
  }, [activeIndex, services.length, services]);

  const activeService = useMemo(() => {
    if (services.length === 0) {
      return null;
    }

    const normalizedIndex = Math.min(activeIndex, services.length - 1);
    return services[normalizedIndex];
  }, [activeIndex, services]);

  const gradientStyle = useMemo(() => {
    if (!activeService) {
      return {};
    }

    return {
      backgroundImage: `linear-gradient(135deg, ${activeService.gradientStart}, ${activeService.gradientEnd})`,
    };
  }, [activeService]);

  if (services.length === 0 || !activeService) {
    return (
      <section className={styles.emptyState}>
        <div className={styles.emptyStateContent}>
          <h1>Services</h1>
          <p>Aktuell stehen keine Services zur Verfügung.</p>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.servicePage}>
      <div className={`section ${styles.serviceSection}`}>
        <div className="sectionContent">
          <h1 className="sectionHeadline">Dein Moment verdient mehr als Zufall!</h1>
          <Swiper
            className={styles.serviceSwiper}
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={50}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            onSlideChange={(swiper) => {
              const nextIndex =
                typeof swiper.realIndex === "number"
                  ? swiper.realIndex
                  : swiper.activeIndex ?? 0;
              setActiveIndex(nextIndex);
            }}
          >
            {services.map((service) => (
              <SwiperSlide key={service.id} className={styles.serviceSwiperSlide}>
                <div className={styles.serviceSlideImageBox}>
                  <div
                    className={styles.octagon}
                    style={{ backgroundImage: `url("${service.imageUrl}")` }}
                    role="img"
                    aria-label={service.label}
                  />
                </div>
                <div className={styles.serviceSlideTextBox}>
                  <span className={styles.serviceSlidePill}>{service.label}</span>
                  <h2 className={styles.serviceSlideHeadline}>{service.headline}</h2>
                  <p className={styles.serviceSlideText}>{service.subline}</p>
                  {service.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${service.id}-paragraph-${index}`}
                      className={styles.serviceSlideText}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <section
        className={styles.serviceDetailsSection}
        style={gradientStyle}
        aria-live="polite"
      >
        <div className={styles.serviceDetailsContent}>
          <div className={styles.serviceDetailsInfo}>
            <span className={styles.serviceSlidePill}>{activeService.label}</span>
            <h2 className={styles.serviceDetailsHeadline}>
              {activeService.infoTitle || activeService.headline}
            </h2>
            {activeService.paragraphs.length > 0 ? (
              <div className={styles.serviceDetailsParagraphs}>
                {activeService.paragraphs.map((paragraph, index) => (
                  <p key={`${activeService.id}-info-${index}`}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className={styles.serviceDetailsFallback}>{activeService.subline}</p>
            )}

            {activeService.bulletPoints.length > 0 && (
              <ul className={styles.serviceDetailsList}>
                {activeService.bulletPoints.map((bullet, index) => (
                  <li key={`${activeService.id}-bullet-${index}`}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.serviceDetailsPortfolio}>
            <div className={styles.servicePortfolioHeader}>
              <h3>Portfolio Highlights</h3>
              <p>Ausgewählte Projekte zum Service</p>
            </div>
            {activeService.portfolioProjects.length === 0 ? (
              <p className={styles.servicePortfolioEmpty}>
                Aktuell sind keine passenden Projekte verlinkt.
              </p>
            ) : (
              <ul className={styles.servicePortfolioList}>
                {activeService.portfolioProjects.map((project) => {
                  const slug = project.slug?.trim();
                  const href = slug && slug.length > 0 ? `/portfolio/${slug}` : "/portfolio";

                  return (
                    <li key={project.id} className={styles.servicePortfolioItem}>
                      <Link href={href} className={styles.servicePortfolioLink}>
                        <div className={styles.servicePortfolioText}>
                          <span className={styles.servicePortfolioTitle}>
                            {project.title}
                          </span>
                          {project.subtitle && (
                            <span className={styles.servicePortfolioSubtitle}>
                              {project.subtitle}
                            </span>
                          )}
                        </div>
                        <span className={styles.servicePortfolioIcon} aria-hidden>
                          <i className="bi-arrow-up-right" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
