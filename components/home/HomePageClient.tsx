"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import styles from "@/app/page.module.css";
import { supabase } from "@/lib/supabaseClient";

const FALLBACK_BACKGROUND = "/DJI_0727.jpg";
const FALLBACK_OVERLAY = "/dawid3Mask.png";

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

  const services = [
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

            <Image src={overlaySrc} alt="Overlay" width={425} height={550} className={styles.overlay} />
          </div>
        </div>
      </section>

      <section className={styles.servicesSection}>
        <div className={styles.servicesContent}>
          <h2>Unsere Leistungen</h2>
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className={styles.servicesSwiper}
          >
            {services.map((service) => (
              <SwiperSlide key={service.title}>
                <article className={styles.serviceCard}>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <section className={styles.secondSection}></section>
    </>
  );
};

export default HomePageClient;
