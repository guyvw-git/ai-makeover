import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zillow AI Makeover",
  description: "Transform real estate listings with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="zillow-ai-extension-ignore" content="true" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased zillow-makeover-app`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
