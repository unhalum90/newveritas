import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";
import "driver.js/dist/driver.css";
import { CookieBanner } from "@/components/cookie-banner";
import { AuthTokenHandler } from "@/components/auth/auth-token-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veritas",
  description: "Teacher-focused oral assessment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthTokenHandler />
        {children}
        <Analytics />
        <CookieBanner />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0CV2K5MWWZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-0CV2K5MWWZ');
          `}
        </Script>
      </body>
    </html>
  );
}
