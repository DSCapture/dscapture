"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const { scrollY } = useScroll();

  // Bewegung des Hintergrunds (langsamer)
  const bgY = useTransform(scrollY, [0, 600], [0, 200]);

  // Bewegung des Overlays (schneller)
  // const overlayY = useTransform(scrollY, [0, 600], [0, 500]);

  return (
    <>
        <section className={styles.heroSection}>
          <div className={styles.wrapper}>
            {/* Hintergrund (langsamer Parallax) */}
            <motion.div style={{ y: bgY }} className={styles.backgroundWrapper}>
              <Image
                src="/DJI_0727.jpg"
                alt="Hintergrund"
                fill
                className={styles.background}
              />
            </motion.div>

            {/* Inhalt */}
            <div className={styles.heroContent}>
              {/* Text links daneben */}
              <div className={styles.textContainer}>
                <h1>Visuelle Exzellenz. Digitale Präzision.</h1>
                <p>DS_Capture vereint Design, Strategie und Technologie zu einem klaren Markenauftritt.</p>
                <button className={styles.ctaButton}>Mehr erfahren</button>
              </div>

              {/* Overlay mit schnellerer Parallaxbewegung */}
              {/* <motion.div style={{ y: overlayY }} className={styles.overlayContainer}> */}
                <Image
                  src="/dawid3Mask.png"
                  alt="Overlay"
                  width={425}
                  height={550}
                  className={styles.overlay}
                />
              {/* </motion.div> */}
            </div>
          </div>
        </section>
        <section className={styles.secondSection}></section>
    </>
  );
}
