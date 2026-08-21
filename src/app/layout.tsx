import type { Metadata, Viewport } from "next";
import { Baloo_2, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/** Baloo 2 is the display anchor. It never sets body copy. */
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Console log, timestamps, counts in dense tables, keyword diffs, ids. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "REACH — what to apply for now, what is blocking you, what to do next",
  description:
    "REACH sorts live postings into Apply Now, One Fix Away and Skip, names the single thing blocking you, and counts exactly how many more roles closing it opens.",
};

export const viewport: Viewport = {
  themeColor: "#F5F3FB",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} ${instrument.variable} ${plexMono.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
