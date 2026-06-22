import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Pastler Immobilienberatung",
    template: "%s · Pastler",
  },
  description: "Internes Dashboard — Immobilienverwaltung Pastler UG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontFamily: "var(--font-inter)", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
