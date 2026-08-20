import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
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
  title: "Cursis — The Customizable Startup Operating System",
  description:
    "Cursis is a fully customizable workspace for startups to manage their team, projects, tasks, deadlines, hiring, and automated workflows — powered by Ordis AI.",
  keywords: [
    "startup operating system",
    "team management",
    "project management",
    "task management",
    "deadline tracker",
    "hiring pipeline",
    "workflow automation",
    "startup OS",
    "Ordis AI",
    "custom business software",
    "customizable workspace",
    "Cursis",
  ],
  authors: [{ name: "Cursis Team" }],
  openGraph: {
    title: "Cursis — The Customizable Startup Operating System",
    description:
      "A fully customizable workspace for startups to manage their team, projects, tasks, deadlines, hiring, and automated workflows.",
    url: "https://cursis.vercel.app",
    siteName: "Cursis",
    images: [
      {
        url: "https://cursis.vercel.app/brand/cursis-logo.png",
        width: 1200,
        height: 630,
        alt: "Cursis AI Business Management Software",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursis — All-in-One AI Business Management Platform",
    description:
      "Connect operations, sales, inventory, CRM, finance, and Ordis AI in one platform.",
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
