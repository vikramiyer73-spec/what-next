import type { Metadata } from "next";
import { Playfair_Display, Archivo, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-italic",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600"],
});

const archivo = Archivo({
  variable: "--font-archivo-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "What Next",
  description: "Tell us the show you just finished. We'll figure out what you'll miss about it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${archivo.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider />
        {children}
        <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
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
