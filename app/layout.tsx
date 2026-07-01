import {ClerkProvider} from "@clerk/nextjs";
import { shadcn } from '@clerk/ui/themes'
import type { Metadata } from "next";
import {IBM_Plex_Serif, Mona_Sans} from "next/font/google";

import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Bookify",
  description: "Transform your books into interactive AI stories. Just upload a PDF and let AI do the rest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en">
    <body
      className={`${ibmPlexSerif.variable} ${monaSans.variable} relative font-sans antialiased`}
    >
      <ClerkProvider appearance={{ theme: shadcn }}>
        <Navbar />
        {children}
      </ClerkProvider>
    </body>
    </html>
  );
}