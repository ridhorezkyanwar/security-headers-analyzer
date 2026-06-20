import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Security Headers Analyzer | Ridho Rezky Anwar",
  description: "Analyze HTTP security headers of any website in real-time. Built by Ridho Rezky Anwar, AWS Certified ML Engineer.",
  keywords: ["security", "headers", "analyzer", "cybersecurity", "HTTP", "HSTS", "CSP"],
  authors: [{ name: "Ridho Rezky Anwar" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}