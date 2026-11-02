import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { StoreProvider } from "@/store/provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mini Project Manager",
  description: "Track projects and their tasks.",
};

/**
 * The theme uses a `.dark` class rather than a media query, so the class has to
 * be set before first paint or the page flashes light.
 */
const THEME_SCRIPT = `try{if(matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <StoreProvider>
          <AuthBootstrap />
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
