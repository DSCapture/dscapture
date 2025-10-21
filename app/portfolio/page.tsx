import type { Metadata } from 'next';
import "./page.module.css";

export const metadata: Metadata = {
  title: 'Portfolio | DS_Capture',
  description: '',
  openGraph: {
    title: 'Portfolio | DS_Capture',
    description: '',
    url: 'https://www.deinedomain.de/about',
    siteName: 'DS_Capture',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function BlogPage() {
    return(
        <h1>Portfolio</h1>
    );
}