"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

interface SwiperBreakpointOptions {
  slidesPerView?: number;
}

type SwiperNavigationConfig =
  | boolean
  | {
      enabled?: boolean;
    };

interface SwiperProps {
  children: ReactNode;
  className?: string;
  modules?: unknown[];
  pagination?: {
    clickable?: boolean;
  };
  navigation?: SwiperNavigationConfig;
  spaceBetween?: number;
  slidesPerView?: number;
  breakpoints?: Record<number, SwiperBreakpointOptions>;
}

interface SwiperSlideProps {
  children: ReactNode;
}

const resolveSlidesPerView = (
  baseSlides: number,
  breakpoints: Record<number, SwiperBreakpointOptions>,
  width: number,
) => {
  const sortedBreakpoints = Object.keys(breakpoints)
    .map(Number)
    .sort((a, b) => a - b);

  let slides = baseSlides;

  sortedBreakpoints.forEach((point) => {
    if (width >= point) {
      slides = breakpoints[point]?.slidesPerView ?? slides;
    }
  });

  return Math.max(slides, 1);
};

const isNavigationEnabled = (navigation?: SwiperNavigationConfig) => {
  if (!navigation) {
    return false;
  }

  if (typeof navigation === "boolean") {
    return navigation;
  }

  return navigation.enabled ?? true;
};

const Swiper = ({
  children,
  className,
  pagination,
  navigation,
  spaceBetween = 0,
  slidesPerView = 1,
  breakpoints = {},
}: SwiperProps) => {
  const slides = useMemo(() => {
    return (Array.isArray(children) ? children : [children]).filter(Boolean) as ReactNode[];
  }, [children]);

  const [currentSlidesPerView, setCurrentSlidesPerView] = useState(slidesPerView);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const updateSlidesPerView = () => {
      if (typeof window === "undefined") {
        return;
      }
      const width = window.innerWidth;
      const resolved = resolveSlidesPerView(slidesPerView, breakpoints, width);
      setCurrentSlidesPerView(resolved);
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);

    return () => {
      window.removeEventListener("resize", updateSlidesPerView);
    };
  }, [breakpoints, slidesPerView]);

  useEffect(() => {
    setActiveIndex((prev) => {
      const maxIndex = Math.max(slides.length - currentSlidesPerView, 0);
      return Math.min(prev, maxIndex);
    });
  }, [currentSlidesPerView, slides.length]);

  const maxIndex = Math.max(slides.length - currentSlidesPerView, 0);
  const translatePercentage = activeIndex * (100 / currentSlidesPerView);
  const navigationEnabled = isNavigationEnabled(navigation);
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < maxIndex;

  const handlePrev = () => {
    if (!canGoPrev) {
      return;
    }
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }
    setActiveIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  return (
    <div className={["swiper", className].filter(Boolean).join(" ")}>
      <div
        className="swiper-wrapper"
        style={{
          gap: `${spaceBetween}px`,
          transform: `translateX(-${translatePercentage}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={(slide as { key?: string | number }).key ?? index}
            className="swiper-slide"
            style={{ minWidth: `${100 / currentSlidesPerView}%` }}
          >
            {slide}
          </div>
        ))}
      </div>

      {pagination && (
        <div className="swiper-pagination">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={[
                "swiper-pagination-bullet",
                index === activeIndex ? "swiper-pagination-bullet-active" : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveIndex(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {navigationEnabled && (
        <div className="swiper-navigation">
          <button
            type="button"
            className={["swiper-button", "swiper-button-prev", !canGoPrev ? "swiper-button-disabled" : undefined]
              .filter(Boolean)
              .join(" ")}
            onClick={handlePrev}
            aria-label="Vorheriger Slide"
            disabled={!canGoPrev}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5 5L8.5 12L15.5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={["swiper-button", "swiper-button-next", !canGoNext ? "swiper-button-disabled" : undefined]
              .filter(Boolean)
              .join(" ")}
            onClick={handleNext}
            aria-label="Nächster Slide"
            disabled={!canGoNext}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 5L15.5 12L8.5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const SwiperSlide = ({ children }: SwiperSlideProps) => <>{children}</>;

export { Swiper, SwiperSlide };
