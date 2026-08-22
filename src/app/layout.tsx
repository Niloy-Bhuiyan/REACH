import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "REACH — find what fits, fix what blocks",
  description:
    "REACH sorts live postings into Apply Now, One Fix Away and Skip, names the one thing blocking you, and counts exactly how many more roles closing it opens.",
};

export const viewport: Viewport = {
  themeColor: "#F6F6F8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * One interface family for everything, one mono for console and data.
 * Typography carries the hierarchy so fewer boxes have to.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
