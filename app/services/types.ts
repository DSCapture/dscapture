export type ServiceProjectLink = {
  id: string;
  title: string;
  slug: string | null;
};

export type ServiceSlideData = {
  id: string;
  slug: string;
  label: string;
  headline: string;
  subline: string;
  infoTitle: string | null;
  infoParagraphs: string[];
  infoBulletPoints: string[];
  gradientStart: string;
  gradientEnd: string;
  imageUrl: string | null;
  imageAlt: string;
  projects: ServiceProjectLink[];
};

export type ServiceSwiperProps = {
  services: ServiceSlideData[];
};
