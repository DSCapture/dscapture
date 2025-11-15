"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";

import type { ServiceSwiperProps } from "./types";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const FALLBACK_GRADIENT_START = "#111827";
const FALLBACK_GRADIENT_END = "#1f2937";

export default function ServiceSwiper({ services }: ServiceSwiperProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [services]);

  const activeService = useMemo(() => services[activeIndex] ?? null, [activeIndex, services]);

  const handleSlideChange = useCallback((swiper: SwiperInstance) => {
    const newIndex = typeof swiper.realIndex === "number" ? swiper.realIndex : swiper.activeIndex;
    setActiveIndex(newIndex ?? 0);
  }, []);

  if (services.length === 0) {
    return null;
  }

  return (
    <div className="swiper-wrapper-container">
      <button className="nav-btn nav-btn-prev" aria-label="Vorheriger Service">
        ‹
      </button>
      <button className="nav-btn nav-btn-next" aria-label="Nächster Service">
        ›
      </button>

      <Swiper
        modules={[Navigation, Pagination]}
        slidesPerView={1}
        spaceBetween={32}
        navigation={{
          nextEl: ".nav-btn-next",
          prevEl: ".nav-btn-prev",
        }}
        pagination={{
          el: ".swiper-pagination",
          clickable: true,
        }}
        onSlideChange={handleSlideChange}
      >
        {services.map((service) => {
          const gradientStart = service.gradientStart || FALLBACK_GRADIENT_START;
          const gradientEnd = service.gradientEnd || FALLBACK_GRADIENT_END;
          return (
            <SwiperSlide key={service.id}>
              <div
                className="slide"
                style={{
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                <div className="slide-left">
                  <div className={`hexagon${service.imageUrl ? "" : " hexagon-placeholder"}`}>
                    {service.imageUrl ? (
                      <Image src={service.imageUrl} alt={service.imageAlt} fill sizes="(max-width: 768px) 60vw, 320px" />
                    ) : null}
                  </div>
                </div>

                <div className="slide-right">
                  <span className="slide-label">{service.label}</span>
                  <h2>{service.headline}</h2>
                  <p>{service.subline}</p>

                  <Link href="/kontakt" className="contact-btn">
                    Jetzt anfragen
                  </Link>

                  {service.projects.length > 0 && (
                    <div className="projects">
                      <span className="projects-label">Ausgewählte Projekte:</span>
                      <ul>
                        {service.projects.map((project) => {
                          const slug = project.slug?.trim();
                          const href = slug ? `/portfolio/${slug}` : undefined;
                          return (
                            <li key={project.id}>
                              {href ? (
                                <Link href={href}>{project.title}</Link>
                              ) : (
                                <span>{project.title}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="swiper-pagination" />

      {activeService && (
        <section className="service-info" aria-live="polite">
          <header className="info-header">
            {activeService.infoTitle ? <h3>{activeService.infoTitle}</h3> : <h3>{activeService.headline}</h3>}
            <p>{activeService.subline}</p>
          </header>

          <div className="info-content">
            {activeService.infoParagraphs.length > 0 && (
              <div className="info-text">
                {activeService.infoParagraphs.map((paragraph, index) => (
                  <p key={`${activeService.id}-paragraph-${index}`}>{paragraph}</p>
                ))}
              </div>
            )}

            {activeService.infoBulletPoints.length > 0 && (
              <ul className="info-list">
                {activeService.infoBulletPoints.map((item, index) => (
                  <li key={`${activeService.id}-bullet-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <style jsx>{`
        .swiper-wrapper-container {
          position: relative;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 0 3rem;
          display: grid;
          gap: 2.5rem;
          max-width: 1100px;
        }

        .slide {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.2fr);
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
          border-radius: 28px;
          padding: clamp(2rem, 5vw, 3rem);
          color: #f8fafc;
          position: relative;
          overflow: hidden;
          box-shadow: 0 28px 60px rgba(15, 23, 42, 0.35);
        }

        @media (max-width: 900px) {
          .slide {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .slide-right {
            align-items: center;
          }
        }

        .slide-left {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hexagon {
          position: relative;
          width: clamp(220px, 30vw, 300px);
          aspect-ratio: 1/1;
          clip-path: polygon(
            25% 6%,
            75% 6%,
            100% 50%,
            75% 94%,
            25% 94%,
            0% 50%
          );
          overflow: hidden;
          background: rgba(15, 23, 42, 0.35);
        }

        .hexagon :global(img) {
          object-fit: cover;
        }

        .hexagon-placeholder {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.35), rgba(30, 41, 59, 0.6));
        }

        .slide-right {
          display: grid;
          gap: 1.25rem;
          align-items: start;
        }

        .slide-label {
          display: inline-block;
          font-size: 0.85rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.85;
        }

        .slide-right h2 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          margin: 0;
        }

        .slide-right p {
          margin: 0;
          line-height: 1.6;
          color: rgba(248, 250, 252, 0.85);
          font-size: clamp(1rem, 2.2vw, 1.2rem);
        }

        .contact-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.75rem;
          border-radius: 999px;
          font-weight: 600;
          text-decoration: none;
          background: rgba(15, 23, 42, 0.95);
          color: #f8fafc;
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .contact-btn:hover,
        .contact-btn:focus-visible {
          background: rgba(15, 23, 42, 0.8);
          transform: translateY(-1px);
        }

        .projects {
          font-size: 0.95rem;
          display: grid;
          gap: 0.75rem;
        }

        .projects-label {
          font-weight: 600;
          opacity: 0.9;
        }

        .projects ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
        }

        .projects a {
          color: #f8fafc;
          text-decoration: none;
          border-bottom: 1px solid rgba(248, 250, 252, 0.45);
          padding-bottom: 0.1rem;
        }

        .projects a:hover,
        .projects a:focus-visible {
          border-bottom-color: #f8fafc;
        }

        .projects span {
          color: rgba(248, 250, 252, 0.7);
        }

        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(15, 23, 42, 0.55);
          color: #f8fafc;
          border: none;
          border-radius: 999px;
          padding: 0.6rem 0.9rem;
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: 500;
          transition: background 0.3s ease, transform 0.3s ease;
        }

        .nav-btn:hover,
        .nav-btn:focus-visible {
          background: rgba(15, 23, 42, 0.85);
          transform: translateY(-50%) scale(1.05);
        }

        .nav-btn-prev {
          left: -0.5rem;
        }

        .nav-btn-next {
          right: -0.5rem;
        }

        @media (max-width: 768px) {
          .nav-btn-prev {
            left: 0;
          }
          .nav-btn-next {
            right: 0;
          }
        }

        :global(.swiper-pagination) {
          bottom: -0.5rem !important;
        }

        :global(.swiper-pagination-bullet) {
          width: 10px;
          height: 10px;
          background: rgba(15, 23, 42, 0.25);
          opacity: 1;
        }

        :global(.swiper-pagination-bullet-active) {
          background: rgba(15, 23, 42, 0.75);
        }

        .service-info {
          background: #ffffff;
          border-radius: 28px;
          padding: clamp(2rem, 4vw, 3rem);
          box-shadow: 0 22px 55px rgba(15, 23, 42, 0.15);
          display: grid;
          gap: 1.75rem;
          color: #0f172a;
        }

        .info-header h3 {
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          margin: 0 0 0.5rem;
        }

        .info-header p {
          margin: 0;
          color: #475467;
          font-size: 1.05rem;
        }

        .info-content {
          display: grid;
          gap: clamp(1.5rem, 3vw, 2.5rem);
        }

        @media (min-width: 900px) {
          .info-content {
            grid-template-columns: 1.2fr 0.8fr;
            align-items: start;
          }
        }

        .info-text {
          display: grid;
          gap: 1rem;
          line-height: 1.7;
          font-size: 1.05rem;
        }

        .info-text p {
          margin: 0;
        }

        .info-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }

        .info-list li::before {
          content: "•";
          color: #2563eb;
          margin-right: 0.5rem;
        }

        .info-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
