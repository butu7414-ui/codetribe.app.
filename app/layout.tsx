import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeTribe | Senior Developer Community",
  description: "The premium, community-first platform for senior software engineers, architects, and technical leaders.",
  openGraph: {
    title: "CodeTribe | Senior Developer Community",
    description: "The premium, community-first platform for senior software engineers, architects, and technical leaders.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-[#6D28D9] selection:text-white">
        {children}
      </body>
    </html>
  );
}
