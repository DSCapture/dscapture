import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { ToastProvider } from "@/components/toast/ToastProvider";
import "bootstrap-icons/font/bootstrap-icons.css"
import "./globals.css";


const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"], 
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "DS_Capture",
  description: "Portfolio & Fotografie von DS_Capture – urbane, ästhetische Bildwelten.",
  openGraph: {
    title: "DS_Capture",
    description: "Portfolio & Fotografie von DS_Capture – urbane, ästhetische Bildwelten.",
    url: "https://dscapture.de",
    siteName: "DS_Capture",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${roboto.className}`}>
        <ToastProvider>
          <div className="siteLayout">
            <Header />
            <main className="siteContent">{children}</main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
