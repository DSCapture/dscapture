"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./ProjectGallery.module.css";

type GalleryImage = {
  id: string;
  caption: string | null;
  alt_text: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  public_url: string;
  display_order: number;
};

type ProjectGalleryProps = {
  images: GalleryImage[];
  projectTitle: string;
};

export default function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});

  const hasMultipleImages = images.length > 1;

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((previous) => {
      if (previous === null) {
        return previous;
      }

      return (previous + 1) % images.length;
    });
  }, [images.length]);

  const showPrevious = useCallback(() => {
    setActiveIndex((previous) => {
      if (previous === null) {
        return previous;
      }

      return (previous - 1 + images.length) % images.length;
    });
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        showNext();
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        showPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, closeLightbox, hasMultipleImages, showNext, showPrevious]);

  const activeImage = useMemo(() => {
    if (activeIndex === null) {
      return null;
    }

    return images[activeIndex] ?? null;
  }, [activeIndex, images]);

  return (
    <div className={styles.gallery}>
      <div className={styles.grid}>
        {images.map((image, index) => {
          const imageAlt =
            image.alt_text?.trim() ||
            image.caption?.trim() ||
            projectTitle;
          const metaTitle =
            image.meta_title?.trim() ||
            image.caption?.trim() ||
            projectTitle;
          const metaDescription =
            image.meta_description?.trim() ||
            image.caption?.trim() ||
            projectTitle;
          const metaKeywords = (image.meta_keywords ?? "")
            .split(",")
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
            .join(", ");

          return (
            <button
              key={image.id}
              type="button"
              className={styles.thumbnailButton}
              onClick={() => openLightbox(index)}
              aria-label={`Bild ${index + 1} in Großansicht öffnen`}
              data-meta-title={metaTitle}
              data-meta-description={metaDescription}
              data-meta-keywords={metaKeywords || undefined}
            >
              <span
                className={styles.thumbnailInner}
                style={{
                  aspectRatio: imageRatios[image.id] ?? 4 / 3,
                }}
                itemProp="associatedMedia"
                itemScope
                itemType="https://schema.org/ImageObject"
              >
                <Image
                  src={image.public_url}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 320px"
                  className={styles.thumbnailImage}
                  itemProp="contentUrl"
                  onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                    if (naturalWidth && naturalHeight) {
                      setImageRatios((previous) => {
                        if (previous[image.id]) {
                          return previous;
                        }

                        return {
                          ...previous,
                          [image.id]: naturalWidth / naturalHeight,
                        };
                      });
                    }
                  }}
                />
                <meta itemProp="name" content={metaTitle} />
                <meta itemProp="description" content={metaDescription} />
                {metaKeywords ? (
                  <meta itemProp="keywords" content={metaKeywords} />
                ) : null}
              </span>
              {image.caption ? (
                <span className={styles.thumbnailCaption}>{image.caption}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeImage ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" onClick={closeLightbox}>
          <div
            className={styles.lightboxContent}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeLightbox}
              aria-label="Großansicht schließen"
            >
              &times;
            </button>

            <div
              className={styles.lightboxImageWrapper}
              itemScope
              itemType="https://schema.org/ImageObject"
            >
              <Image
                src={activeImage.public_url}
                alt={
                  activeImage.alt_text?.trim() ||
                  activeImage.caption?.trim() ||
                  projectTitle
                }
                fill
                sizes="100vw"
                className={styles.lightboxImage}
                itemProp="contentUrl"
              />
              <meta
                itemProp="name"
                content={
                  activeImage.meta_title?.trim() ||
                  activeImage.caption?.trim() ||
                  projectTitle
                }
              />
              <meta
                itemProp="description"
                content={
                  activeImage.meta_description?.trim() ||
                  activeImage.caption?.trim() ||
                  projectTitle
                }
              />
              {(() => {
                const keywords = (activeImage.meta_keywords ?? "")
                  .split(",")
                  .map((keyword) => keyword.trim())
                  .filter((keyword) => keyword.length > 0)
                  .join(", ");
                return keywords ? (
                  <meta itemProp="keywords" content={keywords} />
                ) : null;
              })()}
            </div>

            {activeImage.caption ? (
              <p className={styles.lightboxCaption}>{activeImage.caption}</p>
            ) : (
              <p className={styles.lightboxCaption}>{projectTitle}</p>
            )}

            {hasMultipleImages ? (
              <div className={styles.navigationButtons}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={showPrevious}
                  aria-label="Vorheriges Bild"
                >
                  Zurück
                </button>
                <span className={styles.counter}>
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={showNext}
                  aria-label="Nächstes Bild"
                >
                  Weiter
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
