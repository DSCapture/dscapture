"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

import styles from "@/app/page.module.css";
import { supabase } from "@/lib/supabaseClient";

const FALLBACK_BACKGROUND = "/DJI_0727.jpg";
const FALLBACK_OVERLAY = "/dawid3Mask.png";

type UspItem = {
  title: string;
  description: string;
};

type Review = {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
};

const FALLBACK_USP_ITEMS: UspItem[] = [
  {
    title: "Ganzheitliche Markenstrategie",
    description:
      "Wir verbinden Analyse, Beratung und Umsetzung zu einer klaren Roadmap für Ihre Markenentwicklung.",
  },
  {
    title: "Premium Visual Storytelling",
    description:
      "Inszenierungen, die Emotionen wecken: Von Fotografie bis Film entsteht ein konsistentes Markenerlebnis.",
  },
  {
    title: "Messbare digitale Ergebnisse",
    description:
      "Kreationen, die performen – wir gestalten digitale Experiences mit klaren KPIs und spürbarer Wirkung.",
  },
];

const FALLBACK_REVIEWS: Review[] = [
  {
    id: "fallback-1",
    author: "Studio Blend",
    role: "Creative Director",
    quote:
      "DS_Capture hat unsere Marke mit einem konsistenten visuellen Leitbild gestärkt. Der Prozess war fokussiert und hocheffizient.",
    rating: 5,
  },
  {
    id: "fallback-2",
    author: "NXT Ventures",
    role: "Head of Marketing",
    quote:
      "Von der Strategie bis zur Umsetzung: Das Team hat komplexe Inhalte in klare, inspirierende Kampagnen übersetzt.",
    rating: 5,
  },
  {
    id: "fallback-3",
    author: "Urban Pulse",
    role: "CEO",
    quote:
      "Die Zusammenarbeit war partnerschaftlich und transparent. Unsere digitale Präsenz performt messbar besser.",
    rating: 5,
  },
  {
    id: "fallback-4",
    author: "Lumen Architects",
    role: "Managing Partner",
    quote:
      "Dank DS_Capture sprechen wir unsere Zielgruppe jetzt präzise an – visuell stark und inhaltlich auf den Punkt.",
    rating: 5,
  },
];

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
  const [uspItems, setUspItems] = useState<UspItem[]>(FALLBACK_USP_ITEMS);
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);

  const bgY = useTransform(scrollY, [0, 600], [0, 200]);

  useEffect(() => {
    let isMounted = true;

    const fetchHomepageContent = async () => {
      const imagePromise = supabase
        .from("homepage_images")
        .select("image_type, public_url");
      const uspPromise = supabase
        .from("homepage_usps")
        .select("title, description, display_order")
        .order("display_order", { ascending: true });

      const reviewsPromise = supabase
        .from("homepage_reviews")
        .select("id, author, role, quote, rating, display_order")
        .order("display_order", { ascending: true });

      const [imageResult, uspResult, reviewResult] = await Promise.all([
        imagePromise,
        uspPromise,
        reviewsPromise,
      ]);

      if (!isMounted) {
        return;
      }

      const { data: imageData, error: imageError } = imageResult;

      if (imageError) {
        console.error("Fehler beim Laden der Homepage-Bilder:", imageError.message);
      } else {
        imageData?.forEach((item) => {
          if (item.image_type === "background") {
            setBackgroundImageUrl(item.public_url);
          }
          if (item.image_type === "overlay") {
            setOverlayImageUrl(item.public_url);
          }
        });
      }

      const { data: uspData, error: uspError } = uspResult;

      if (uspError) {
        console.error("Fehler beim Laden der USP-Punkte:", uspError.message);
      } else if (uspData && uspData.length > 0) {
        const itemsByOrder = new Map(
          uspData.map((record) => [record.display_order, record]),
        );

        const normalizedItems = [1, 2, 3].map((order, index) => {
          const record = itemsByOrder.get(order);
          const fallback = FALLBACK_USP_ITEMS[index];

          if (!record) {
            return fallback;
          }

          return {
            title: record.title ?? fallback.title,
            description: record.description ?? fallback.description,
          };
        });

        setUspItems(normalizedItems);
      }
      const { data: reviewData, error: reviewError } = reviewResult;

      if (reviewError) {
        console.error("Fehler beim Laden der Rezensionen:", reviewError.message);
      } else if (reviewData && reviewData.length > 0) {
        const normalizedReviews = reviewData
          .map((record, index) => {
            const ratingValue = typeof record.rating === "number" ? record.rating : 5;
            const clampedRating = Math.min(5, Math.max(1, ratingValue));

            return {
              id: String(record.id ?? `review-${index}`),
              author: record.author?.trim() ?? "",
              role: record.role?.trim() ?? "",
              quote: record.quote?.trim() ?? "",
              rating: clampedRating,
            } satisfies Review;
          })
          .filter((review) => review.author && review.quote);

        if (normalizedReviews.length > 0) {
          setReviews(normalizedReviews);
        }
      }
    };

    void fetchHomepageContent();

    return () => {
      isMounted = false;
    };
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
            <Image src={overlaySrc} alt="Overlay" width={350} height={450} className={styles.overlay} />

            <div className={styles.textContainer}>
              <h1>Visuelle Exzellenz. Digitale Präzision.</h1>
              <p>DS_Capture vereint Design, Strategie und Technologie zu einem klaren Markenauftritt.</p>
              <button className={styles.ctaButton}>Mehr erfahren</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.uspSection} aria-label="Unsere Alleinstellungsmerkmale">
        <div className={styles.uspWrapper}>
          <h2 className={styles.uspHeading}>Was uns auszeichnet</h2>
          <div className={styles.uspContent}>
            {uspItems.map((usp) => (
              <article key={usp.title} className={styles.uspItem}>
                <h3>{usp.title}</h3>
                <p>{usp.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.reviewsSection} aria-label="Kundenrezensionen">
        <div className={styles.reviewsWrapper}>
          <h2 className={styles.reviewsHeading}>Kundenrezensionen</h2>
          <div className={styles.reviewsScroller} role="list">
            {reviews.map((review) => (
              <article key={review.id} className={styles.reviewCard} role="listitem">
                <div
                  className={styles.reviewRating}
                  aria-label={`${review.rating} von 5 Sternen`}
                >
                  <div className={styles.reviewStars} aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={
                          index < review.rating
                            ? styles.reviewStarFilled
                            : styles.reviewStarEmpty
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className={styles.reviewRatingText}>{review.rating} / 5</span>
                </div>
                <p className={styles.reviewQuote}>“{review.quote}”</p>
                <p className={styles.reviewAuthor}>
                  {review.author}
                  {review.role ? (
                    <span className={styles.reviewRole}> · {review.role}</span>
                  ) : null}
                </p>
              </article>
            ))}
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
