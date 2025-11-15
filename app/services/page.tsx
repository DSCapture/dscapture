import type { Metadata } from "next";
import ServiceSwiper from "./ServiceSwiperClient";

export const metadata: Metadata = {
  title: "Service | DS_Capture",
  description: "Unsere Services im Überblick.",
};

export default function ServicesPage() {
  return (
    <main
      style={{
        padding: "4rem 2rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 700,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Service
        </h1>

        <ServiceSwiper />
      </div>
    </main>
  );
}
