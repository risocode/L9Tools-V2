
/*
 * =================================================================
 * ROOT LAYOUT & STYLESHEET IMPORTS
 * =================================================================
 * This is the root layout for the application.
 *
 * CSS Import Order:
 * The order of CSS imports is critical for the cascade. We follow a
 * standard convention:
 * 1. globals.css:       Sets up Tailwind CSS layers.
 * 2. theme.css:         Contains CSS variables, base styles, fonts.
 * 3. animations.css:    Global keyframe animations.
 * 4. layouts.css:       Major page structure styles.
 * 5. components/*.css:  Individual component styles.
 * 6. utilities.css:     Override and helper classes.
 * =================================================================
 */
import "./globals.css";
import "../styles/theme.css";
import "../styles/animations.css";
import "../styles/layouts.css";
import "../styles/components/buttons.css";
import "../styles/components/cards.css";
import "../styles/components/dialogs.css";
import "../styles/components/dropdowns.css";
import "../styles/components/forms.css";
import "../styles/components/loaders.css";
import "../styles/components/profile.css";
import "../styles/components/selects.css";
import "../styles/components/tables.css";
import "../styles/components/tooltips.css";
import "../styles/utilities.css";

import { Suspense } from "react";
import { Cinzel, Inter, Roboto, Orbitron } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import PageLoaderWrapper from "@/components/layout/page-loader-wrapper";
import { LoadingProvider } from "@/context/loading-context";
import { AdProvider } from "@/context/ad-context";


const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "700"],
});
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "L9 Tools | Boss Timers & Guild Tools for Lord Nine",
  description:
    "The ultimate toolkit for Lord Nine players. Track boss spawns with real-time timers, get map locations, and send Discord reports to your guild.",
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${cinzel.variable} ${inter.variable} ${roboto.variable} ${orbitron.variable} h-full`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="theme-color" content="#18181b" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1482729173853463"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="font-roboto h-full flex flex-col bg-background">
        <AuthProvider>
          <LoadingProvider>
            <AdProvider>
              <Suspense>
                {children}
              </Suspense>
              <Toaster />
              <PageLoaderWrapper />
            </AdProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
