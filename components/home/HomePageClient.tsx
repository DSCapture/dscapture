"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

import styles from "@/app/page.module.css";
import { supabase } from "@/lib/supabaseClient";

const FALLBACK_BACKGROUND = "/DJI_0727.jpg";
const FALLBACK_OVERLAY = "/dawid3Mask.png";

const SERVICES = [
  {
    title: "Strategische Markenführung",
    description:
      "Wir entwickeln klare Strategien, die Ihre Marke auf allen Kanälen prägnant und wiedererkennbar positionieren.",
  },
  {
    title: "Visuelles Design",
    description:
      "Von Logos bis zu Kampagnenshootings – wir gestalten visuelle Erlebnisse, die im Gedächtnis bleiben.",
  },
  {
    title: "Digitale Experiences",
    description:
      "Wir schaffen digitale Auftritte, die Technologie und Ästhetik vereinen und Nutzer nachhaltig begeistern.",
  },
  {
    title: "Content Produktion",
    description:
      "Mit Foto- und Videoproduktionen erzählen wir Geschichten, die Ihre Zielgruppe berühren und aktivieren.",
  },
];

const HomePageClient = () => {
  const { scrollY } = useScroll();
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(null);

  const bgY = useTransform(scrollY, [0, 600], [0, 200]);

  useEffect(() => {
    const fetchHomepageImages = async () => {
      const { data, error } = await supabase
        .from("homepage_images")
        .select("image_type, public_url");

      if (error) {
        console.error("Fehler beim Laden der Homepage-Bilder:", error.message);
        return;
      }

      data?.forEach((item) => {
        if (item.image_type === "background") {
          setBackgroundImageUrl(item.public_url);
        }
        if (item.image_type === "overlay") {
          setOverlayImageUrl(item.public_url);
        }
      });
    };

    void fetchHomepageImages();
  }, []);

  const backgroundSrc = backgroundImageUrl ?? FALLBACK_BACKGROUND;
  const overlaySrc = overlayImageUrl ?? FALLBACK_OVERLAY;
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const totalServices = SERVICES.length;

  const clampIndex = useCallback(
    (index: number) => {
      if (index < 0) {
        return 0;
      }

      if (index >= totalServices) {
        return totalServices - 1;
      }

      return index;
    },
    [totalServices]
  );

  const scrollToService = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = carouselRef.current;

      if (!container) {
        return;
      }

      const targetIndex = clampIndex(index);
      const slides = Array.from(container.children) as HTMLElement[];
      const targetSlide = slides[targetIndex];

      if (!targetSlide) {
        return;
      }

      const containerCenter = container.clientWidth / 2;
      const slideCenter = targetSlide.offsetLeft + targetSlide.offsetWidth / 2;
      const rawTarget = slideCenter - containerCenter;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const targetScrollLeft = Math.max(0, Math.min(rawTarget, Math.max(0, maxScrollLeft)));

      if (typeof container.scrollTo === "function") {
        container.scrollTo({
          left: targetScrollLeft,
          behavior,
        });
      } else {
        container.scrollLeft = targetScrollLeft;
      }

      setActiveServiceIndex(targetIndex);
    },
    [clampIndex]
  );

  const handlePrev = useCallback(() => {
    scrollToService(activeServiceIndex - 1);
  }, [activeServiceIndex, scrollToService]);

  const handleNext = useCallback(() => {
    scrollToService(activeServiceIndex + 1);
  }, [activeServiceIndex, scrollToService]);

  const handlePaginationClick = useCallback(
    (index: number) => {
      scrollToService(index);
    },
    [scrollToService]
  );

  useEffect(() => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const slides = Array.from(container.children) as HTMLElement[];

      if (!slides.length) {
        return;
      }

      const viewCenter = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const distance = Math.abs(slideCenter - viewCenter);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveServiceIndex((prev) => (prev === closestIndex ? prev : closestIndex));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [totalServices]);

  useEffect(() => {
    const handleResize = () => {
      scrollToService(activeServiceIndex, "auto");
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeServiceIndex, scrollToService]);

  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const swiperInstanceRef = useRef<SwiperInstance | null>(null);

  const updateSwiperNavigation = useCallback(() => {
    const swiper = swiperInstanceRef.current;
    const prevEl = prevButtonRef.current;
    const nextEl = nextButtonRef.current;

    if (!swiper || !prevEl || !nextEl) {
      return;
    }

    if (typeof swiper.params.navigation === "boolean" || !swiper.params.navigation) {
      swiper.params.navigation = {
        enabled: true,
        prevEl,
        nextEl,
      };
    } else {
      swiper.params.navigation.prevEl = prevEl;
      swiper.params.navigation.nextEl = nextEl;
    }

    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  const handleSwiperInit = useCallback(
    (swiper: SwiperInstance) => {
      swiperInstanceRef.current = swiper;
      updateSwiperNavigation();
    },
    [updateSwiperNavigation]
  );

  const setPrevButtonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      prevButtonRef.current = node;
      updateSwiperNavigation();
    },
    [updateSwiperNavigation]
  );

  const setNextButtonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      nextButtonRef.current = node;
      updateSwiperNavigation();
    },
    [updateSwiperNavigation]
  );

  return (
    <>
      <section className={styles.heroSection}>
        <div className={styles.wrapper}>
          <motion.div style={{ y: bgY }} className={styles.backgroundWrapper}>
            <Image src={backgroundSrc} alt="Hintergrund" fill className={styles.background} />
          </motion.div>

          <div className={styles.heroContent}>
            <div className={styles.textContainer}>
              <h1>Visuelle Exzellenz. Digitale Präzision.</h1>
              <p>DS_Capture vereint Design, Strategie und Technologie zu einem klaren Markenauftritt.</p>
              <button className={styles.ctaButton}>Mehr erfahren</button>
            </div>

            <Image src={overlaySrc} alt="Overlay" width={350} height={450} className={styles.overlay} />
          </div>
        </div>
      </section>

      <section className={styles.servicesSection}>
        <div className={styles.servicesContent}>
          <div className={styles.servicesHeader}>
            <h2>Unsere Leistungen</h2>
            <div className={styles.servicesNavigation}>
              <button
                type="button"
                onClick={handlePrev}
                className={styles.navButton}
                aria-label="Vorheriger Service"
                disabled={activeServiceIndex === 0}
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={styles.navButton}
                aria-label="Nächster Service"
                disabled={activeServiceIndex === totalServices - 1}
              >
                Weiter
              </button>
            </div>
          </div>
          <div className={styles.servicesCarousel}>
            <div ref={carouselRef} className={styles.servicesViewport}>
              {SERVICES.map((service) => (
                <div key={service.title} className={styles.serviceSlide}>
                  <article className={styles.serviceCard}>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </article>
                </div>
              ))}
            </div>
            <div className={styles.servicesPagination} role="tablist" aria-label="Service Auswahl">
              {SERVICES.map((service, index) => {
                const isActive = index === activeServiceIndex;

                return (
                  <button
                    key={service.title}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${service.title} anzeigen`}
                    className={
                      isActive
                        ? `${styles.paginationBullet} ${styles.paginationBulletActive}`
                        : styles.paginationBullet
                    }
                    onClick={() => handlePaginationClick(index)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePageClient;
