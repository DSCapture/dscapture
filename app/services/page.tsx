import type { Metadata } from "next";
import ServicesView, { type ServiceDefinition } from "./ServicesView";

export const metadata: Metadata = {
  title: "Services | DS_Capture",
  description: "Überblick über die Services von DS_Capture.",
};

const services: readonly ServiceDefinition[] = [
  {
    id: "event",
    label: "Eventfotografie",
    headline: "Momente einfangen, die bleiben",
    subline: "Emotionale Reportagen für Veranstaltungen jeder Größe.",
    info: {
      title: "Eventfotografie",
      paragraphs: [
        "Wir begleiten Ihr Event mit einem Auge für emotionale Highlights und authentische Details.",
        "Von Firmenfeiern bis hin zu privaten Jubiläen: Wir erstellen eine vollständige Bildgeschichte, die Ihren Anlass unvergesslich macht.",
      ],
      bulletPoints: [
        "Unauffällige Begleitung vor Ort",
        "Schnelle Bildbereitstellung für Social Media",
        "Optionaler Livestream-Support",
      ],
    },
    gradient: ["#0c1d4d", "#2756ff"],
  },
  {
    id: "product",
    label: "Produktfotografie",
    headline: "Produkte, die sich von allein verkaufen",
    subline: "Makellose Studioaufnahmen für E-Commerce und Print.",
    info: {
      title: "Produktfotografie",
      paragraphs: [
        "Wir setzen Ihr Produkt so in Szene, dass alle Besonderheiten perfekt zur Geltung kommen.",
        "Dank modernster Lichttechnik und professionellem Styling liefern wir überzeugende Ergebnisse für Shop, Werbung und Katalog.",
      ],
      bulletPoints: [
        "360°-Ansichten und Packshots",
        "Farbtreue Bildbearbeitung",
        "Flexible Shooting-Sets",
      ],
    },
    gradient: ["#32195a", "#b845ff"],
  },
  {
    id: "social",
    label: "Social Media Content",
    headline: "Content, der Ihre Community begeistert",
    subline: "Trendbewusste Kurzformate für Stories, Reels und Ads.",
    info: {
      title: "Social Media Content",
      paragraphs: [
        "Wir entwickeln und produzieren kurzweilige Clips und dynamische Visuals, die Ihre Marke ins Gespräch bringen.",
        "Gemeinsam planen wir Content-Serien, die perfekt auf Ihre Ziele und Kanäle abgestimmt sind.",
      ],
      bulletPoints: [
        "Redaktionsplanung & Storyboards",
        "On-Location- und Studio-Produktionen",
        "Analyse & Optimierung der Kampagnenleistung",
      ],
    },
    gradient: ["#123d2a", "#3fcf8e"],
  },
  {
    id: "branding",
    label: "Branding Workshops",
    headline: "Strategien für starke Markenbilder",
    subline: "Gemeinsame Sessions für ein klares visuelles Profil.",
    info: {
      title: "Branding Workshops",
      paragraphs: [
        "In intensiven Workshops entwickeln wir mit Ihnen eine Bildsprache, die zu Ihrer Identität passt.",
        "Wir definieren Moodboards, Guidelines und Content-Roadmaps, die intern weitergetragen werden können.",
      ],
      bulletPoints: [
        "Individuelle Markenanalyse",
        "Gemeinsame Style-Guides",
        "Umsetzbare Action-Pläne",
      ],
    },
    gradient: ["#4a1d1d", "#ff7a5f"],
  },
];

export default function ServicesPage() {
  return <ServicesView services={services} />;
}
