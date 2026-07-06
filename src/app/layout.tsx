import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppPromptHub - Free AI Web Apps & Image Prompts Library",
  description: "Curated database of production-ready AI prompts for web apps, copywriting, and Midjourney designs. Copy, customize, and build in seconds.",
  metadataBase: new URL("https://appprompthub.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AppPromptHub - Free AI Web Apps & Image Prompts Library",
    description: "Curated database of production-ready AI prompts for web apps, copywriting, and Midjourney designs. Copy, customize, and build in seconds.",
    url: "https://appprompthub.com",
    siteName: "AppPromptHub",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AppPromptHub Preview Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppPromptHub - Free AI Web Apps & Image Prompts Library",
    description: "Curated database of production-ready AI prompts. Copy, customize, and build in seconds.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
