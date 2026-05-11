import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SmoothScroll } from "@/components/SmoothScroll";

import localFont from "next/font/local";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const thunder = localFont({
  src: [
    {
      path: "../../public/fonts/Thunder-LightHC.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Thunder-HC.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Thunder-MediumHC.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Thunder-SemiBoldHC.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Thunder-BoldHC.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Thunder-ExtraBoldHC.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-display",
});

const thunderLC = localFont({
  src: [
    {
      path: "../../public/fonts/Thunder-BoldLC.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display-lc",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ommimedia.in"),
  title: {
    default: "ommi media — Content that commands attention",
    template: "%s | ommi media",
  },
  description: "A creative studio crafting bold brand films, product launches and digital experiences with strategy, design and engineering.",
  keywords: ["Creative Studio", "Brand Films", "Product Launch", "Digital Experiences", "Content Strategy", "Video Production", "OMMI MEDIA"],
  authors: [{ name: "ommi media" }],
  creator: "ommi media",
  publisher: "ommi media",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ommimedia.in",
    siteName: "ommi media",
    title: "ommi media — Content that commands attention",
    description: "A creative studio crafting bold brand films, product launches and digital experiences with strategy, design and engineering.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ommi media — Content that commands attention",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ommi media — Content that commands attention",
    description: "A creative studio crafting bold brand films, product launches and digital experiences with strategy, design and engineering.",
    images: ["/og-image.png"],
    creator: "@ommimedia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${thunder.variable} ${thunderLC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Providers>
          <SmoothScroll />
          {children}
        </Providers>
      </body>
    </html>
  );
}
