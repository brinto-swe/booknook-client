import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/home/Navbar";
import Providers from "@/components/home/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: { default: "BookNook — Discover Your Next Great Read", template: "%s | BookNook" },
  description: "Discover your next great read at BookNook. Explore books, find new favorites, and grow your love of reading.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers><a href="#main-content" className="skip-link">Skip to content</a><Navbar />{children}</Providers></body>
    </html>
  );
}
