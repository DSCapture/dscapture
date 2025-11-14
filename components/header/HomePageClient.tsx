"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ContactButton from "../buttons/contactButton/ContactButton";

import styles from "@/app/page.module.css";

const FALLBACK_BACKGROUND = "/DJI_0727.jpg";
const FALLBACK_OVERLAY = "/dawid3Mask.png";

type UspItem = {
  title: string;
  description: string;
};

type BenefitItem = {
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

type PhotographerIntro = {
  heading: string;
  subheading: string | null;
  body: string;
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

const FALLBACK_BENEFITS: BenefitItem[] = [
  {
    title: "Strategie & Kreation aus einer Hand",
    description:
      "Wir begleiten Ihr Team von der Markenpositionierung bis zur finalen Produktion und sorgen für konsistente Botschaften in jedem Kanal.",
  },
  {
    title: "Prozesse mit messbarem Impact",
    description:
      "Transparente Workflows, klare KPIs und regelmäßige Reportings stellen sicher, dass jede Produktion Ihr Business-Ziel unterstützt.",
  },
  {
    title: "Premium Experience für Ihre Zielgruppe",
    description:
      "Wir kombinieren High-End-Visuals mit intuitiven digitalen Touchpoints, damit sich Ihre Marke unverwechselbar anfühlt.",
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

const FALLBACK_PHOTOGRAPHER_INTRO: PhotographerIntro = {
  heading: "Der Fotograf hinter DS_Capture",
  subheading: "Daniel Szymański vereint künstlerische Vision und strategische Markenführung.",
  body:
    "Mit über einem Jahrzehnt Erfahrung in Fotografie, Regie und visueller Kommunikation entwickelt Daniel Szymański Bildwelten, die Markenidentitäten erlebbar machen. Von der ersten Idee bis zur finalen Produktion begleitet er Unternehmen als kreativer Sparringspartner – analytisch, präzise und mit Gespür für Emotionen.",
};

const HomePageClient = () => {
  const { scrollY } = useScroll();
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(null);
  const [uspItems, setUspItems] = useState<UspItem[]>(FALLBACK_USP_ITEMS);
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [photographerIntro, setPhotographerIntro] =
    useState<PhotographerIntro>(FALLBACK_PHOTOGRAPHER_INTRO);
  const [benefits, setBenefits] = useState<BenefitItem[]>(FALLBACK_BENEFITS);

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

      const benefitsPromise = supabase
        .from("homepage_benefits")
        .select("title, description, display_order")
        .order("display_order", { ascending: true });

      const photographerIntroPromise = supabase
        .from("homepage_photographer_intro")
        .select("heading, subheading, body")
        .maybeSingle();

      const [
        imageResult,
        uspResult,
        reviewResult,
        photographerIntroResult,
        benefitsResult,
      ] = await Promise.all([
        imagePromise,
        uspPromise,
        reviewsPromise,
        photographerIntroPromise,
        benefitsPromise,
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

      const { data: benefitsData, error: benefitsError } = benefitsResult;

      if (benefitsError) {
        console.error("Fehler beim Laden der Benefits:", benefitsError.message);
      } else if (benefitsData && benefitsData.length > 0) {
        const benefitsByOrder = new Map(
          benefitsData.map((record) => [record.display_order, record]),
        );

        const normalizedBenefits = [1, 2, 3].map((order, index) => {
          const record = benefitsByOrder.get(order);
          const fallback = FALLBACK_BENEFITS[index];

          if (!record) {
            return fallback;
          }

          return {
            title: record.title?.trim() || fallback.title,
            description: record.description?.trim() || fallback.description,
          } satisfies BenefitItem;
        });

        setBenefits(normalizedBenefits);
      }

      const { data: photographerIntroData, error: photographerIntroError } =
        photographerIntroResult;

      if (photographerIntroError) {
        if (photographerIntroError.code !== "PGRST116") {
          console.error(
            "Fehler beim Laden der Fotografen-Vorstellung:",
            photographerIntroError.message,
          );
        }
      } else if (photographerIntroData) {
        const heading =
          photographerIntroData.heading?.trim() || FALLBACK_PHOTOGRAPHER_INTRO.heading;
        const subheading = photographerIntroData.subheading?.trim() ?? null;
        const body =
          photographerIntroData.body?.trim() || FALLBACK_PHOTOGRAPHER_INTRO.body;

        setPhotographerIntro({ heading, subheading, body });
      }
    };

    void fetchHomepageContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const backgroundSrc = backgroundImageUrl ?? FALLBACK_BACKGROUND;
  const overlaySrc = overlayImageUrl ?? FALLBACK_OVERLAY;
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
              <div className={styles.buttonBox}>
                <ContactButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.uspSection} aria-label="Unsere Alleinstellungsmerkmale">
        <div className={styles.uspWrapper}>
          <div className={styles.uspContent}>
            {uspItems.map((usp) => (
              <article key={usp.title} className={styles.uspItem}>
                <span className={styles.checkIcon}><i className="bi bi-check"></i></span>
                <p>{usp.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className={styles.photographerSection}
        aria-label="Vorstellung des Fotografen"
      >
        <div className={styles.photographerWrapper}>
          <div className={styles.photographerContent}>
            <h2 className={styles.photographerHeading}>{photographerIntro.heading}</h2>
            {photographerIntro.subheading ? (
              <p className={styles.photographerSubheading}>
                {photographerIntro.subheading}
              </p>
            ) : null}
            <div className={styles.photographerBody}>
              {photographerIntro.body
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trim())
                .filter((paragraph) => paragraph.length > 0)
                .map((paragraph, index) => (
                  <p key={`photographer-paragraph-${index}`}>{paragraph}</p>
                ))}
            </div>
            <ContactButton />
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

      <section className={styles.benefitsSection} aria-label="Ihre Vorteile mit DS_Capture">
        <div className={styles.benefitsWrapper}>
          <div className={styles.benefitsHeader}>
            <p className={styles.benefitsEyebrow}>Ihre Vorteile</p>
            <h2 className={styles.benefitsHeading}>
              Warum DS_Capture Ihr Markenauftritt voranbringt
            </h2>
            <p className={styles.benefitsIntro}>
              Drei klar strukturierte Leistungen, die Strategie, Kreation und Wirkung verbinden –
              damit Ihr Auftritt nachhaltig im Gedächtnis bleibt.
            </p>
          </div>

          <div className={styles.benefitsGrid}>
            {benefits.map((benefit, index) => (
              <article key={`${benefit.title}-${index}`} className={styles.benefitCard}>
                <span className={styles.benefitIndex}>{String(index + 1).padStart(2, "0")}</span>
                <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                <p className={styles.benefitDescription}>{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default HomePageClient;
