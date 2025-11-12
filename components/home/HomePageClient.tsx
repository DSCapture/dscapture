"use client";

import { useEffect, useState } from "react";
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
          <h2 className={styles.uspHeading}>Was mich auszeichnet</h2>
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

    </>
  );
};

export default HomePageClient;
