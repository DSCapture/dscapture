"use client";

import dynamic from "next/dynamic";

import type { ServiceSwiperProps } from "./types";

const ServiceSwiper = dynamic<ServiceSwiperProps>(() => import("./ServiceSwiper"), {
  ssr: false,
});

export default function ServiceSwiperClient(props: ServiceSwiperProps) {
  return <ServiceSwiper {...props} />;
}
