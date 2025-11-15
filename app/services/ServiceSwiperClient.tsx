"use client";

import dynamic from "next/dynamic";

const ServiceSwiper = dynamic(() => import("./ServiceSwiper"), {
  ssr: false,
});

export default ServiceSwiper;
