"use client";

import SwiperCore, { Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";

// Swiper initialisieren (wichtig bei älteren Versionen)
SwiperCore.use([Navigation, Pagination]);

// Styles laden
import "swiper/swiper.min.css";
import "swiper/components/navigation/navigation.min.css";
import "swiper/components/pagination/pagination.min.css";

type SlideProject = {
  label: string;
  url: string;
};

type Slide = {
  id: number;
  title: string;
  description: string;
  imageSrc: string;
  projects: SlideProject[];
};

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "Brand & Webdesign",
    description:
      "Klarer, konsistenter Markenauftritt – vom ersten Eindruck bis zum letzten Pixel.",
    imageSrc: "/images/service-brand-webdesign.jpg",
    projects: [
      { label: "Projekt Alpha", url: "/portfolio/projekt-alpha" },
      { label: "Projekt Beta", url: "/portfolio/projekt-beta" },
    ],
  },
  {
    id: 2,
    title: "Fotografie & Art Direction",
    description:
      "Bildwelten, die deine Story transportieren und deine Zielgruppe emotional abholen.",
    imageSrc: "/images/service-photography.jpg",
    projects: [
      { label: "Studio Portraits", url: "/portfolio/studio-portraits" },
      { label: "On-Location Shoot", url: "/portfolio/location-shoot" },
    ],
  },
  {
    id: 3,
    title: "Content-Produktion",
    description:
      "Social-, Website- und Kampagnen-Content aus einem Guss – effizient produziert.",
    imageSrc: "/images/service-content.jpg",
    projects: [
      { label: "Campaign X", url: "/portfolio/campaign-x" },
      { label: "Shortform Reels", url: "/portfolio/reels" },
    ],
  },
  {
    id: 4,
    title: "Strategie & Begleitung",
    description:
      "Gemeinsamer Sparringspartner für Positionierung, Funnel-Logik und Markenaufbau.",
    imageSrc: "/images/service-strategy.jpg",
    projects: [
      { label: "Brand Sprint", url: "/portfolio/brand-sprint" },
      { label: "Relaunch DS_Capture", url: "/portfolio/ds-capture" },
    ],
  },
];

export default function ServiceSwiper() {
  return (
    <div className="swiper-wrapper-container">
      
      {/* Buttons */}
      <button className="nav-btn nav-btn-prev">prev</button>
      <button className="nav-btn nav-btn-next">next</button>

      <Swiper
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
      >
        {SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="slide">
              {/* Hexagon Image */}
              <div className="slide-left">
                <div className="hexagon">
                  <Image
                    src={slide.imageSrc}
                    alt={slide.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>

              {/* Textcontent */}
              <div className="slide-right">
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>

                <button className="contact-btn">Jetzt anfragen</button>

                {slide.projects.length > 0 && (
                  <div className="projects">
                    <span className="projects-label">Ausgewählte Projekte:</span>
                    <ul>
                      {slide.projects.map((project) => (
                        <li key={project.url}>
                          <a href={project.url}>{project.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination */}
      <div className="swiper-pagination"></div>

      {/* Styles */}
      <style jsx>{`
        .swiper-wrapper-container {
          position: relative;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 0 3rem;
        }

        .slide {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 2rem;
          align-items: center;
        }

        @media (max-width: 768px) {
          .slide {
            grid-template-columns: 1fr;
          }
        }

        .slide-left {
          display: flex;
          justify-content: center;
        }

        .hexagon {
          position: relative;
          width: 260px;
          aspect-ratio: 1/1;
          clip-path: polygon(
            25% 5%,
            75% 5%,
            100% 50%,
            75% 95%,
            25% 95%,
            0% 50%
          );
          overflow: hidden;
        }

        .slide-right h2 {
          font-size: 1.8rem;
          margin-bottom: 0.75rem;
        }

        .slide-right p {
          margin-bottom: 1.5rem;
          line-height: 1.6;
          color: #4b5563;
        }

        .contact-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #f9fafb;
          margin-bottom: 1rem;
        }

        .contact-btn:hover {
          opacity: 0.9;
        }

        .projects {
          font-size: 0.9rem;
        }

        .projects-label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .projects ul {
          list-style: none;
          padding: 0;
          display: flex;
          gap: 0.5rem 1rem;
          flex-wrap: wrap;
        }

        .projects a {
          text-decoration: none;
          color: #111827;
          border-bottom: 1px solid rgba(15, 23, 42, 0.2);
        }

        .projects a:hover {
          border-bottom-color: #111827;
        }

        /* Navigation Buttons */
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(15, 23, 42, 0.9);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-weight: 600;
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

        /* Pagination */
        :global(.swiper-pagination) {
          bottom: 0 !important;
        }

        :global(.swiper-pagination-bullet) {
          width: 10px;
          height: 10px;
          background: #d1d5db;
          opacity: 1;
        }

        :global(.swiper-pagination-bullet-active) {
          background: #111827;
        }
      `}</style>
    </div>
  );
}
