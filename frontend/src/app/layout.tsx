import type { Metadata } from "next";
import { Castoro_Titling, Dancing_Script, Outfit, JetBrains_Mono, Great_Vibes } from "next/font/google";
import "./globals.css";

const castoro = Castoro_Titling({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const dancing = Dancing_Script({
  variable: "--font-handwriting",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const signature = Great_Vibes({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Renaissance | Research Assistant",
  description: "Renaissance — an autonomous research assistant powered by adversarial verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${castoro.variable} ${dancing.variable} ${outfit.variable} ${mono.variable} ${signature.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
