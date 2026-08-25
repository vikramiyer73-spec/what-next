import type { Metadata } from "next";
import { Barlow_Condensed, Alegreya } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

// Only the weights actually used — loading full families here would be a
// real latency cost for no visual benefit. Two families total (down from
// three): Barlow Condensed for structural/UI text, Alegreya for reading copy.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500"],
});

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "What Next",
  description: "Tell us the show you just finished. We'll figure out what you'll miss about it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${alegreya.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider />
        {children}
        <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-[#9791B8]">
          This product uses the TMDB API but is not endorsed or certified by{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            TMDB
          </a>
          .
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
