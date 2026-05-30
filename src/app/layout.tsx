import type { Metadata, Viewport } from "next";
import { Lora, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bíblia Sagrada · Ave Maria",
    template: "%s · Bíblia Ave Maria",
  },
  description:
    "Leia a Bíblia Sagrada Católica completa online, versão Ave Maria. Antigo e Novo Testamento, versículos, guia para rezar o Terço e muito mais.",
  keywords: [
    "bíblia sagrada",
    "bíblia católica",
    "bíblia ave maria",
    "sagrada escritura",
    "antigo testamento",
    "novo testamento",
    "versículos bíblicos",
    "terço católico",
    "rosário",
    "orações católicas",
  ],
  authors: [{ name: "Bíblia Ave Maria" }],
  creator: "Bíblia Ave Maria",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Bíblia Ave Maria",
    title: "Bíblia Sagrada · Ave Maria",
    description:
      "Leia a Bíblia Sagrada Católica completa online. Versão Ave Maria com Antigo e Novo Testamento.",
  },
  twitter: {
    card: "summary",
    title: "Bíblia Sagrada · Ave Maria",
    description:
      "Leia a Bíblia Sagrada Católica completa online. Versão Ave Maria.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bíblia Ave Maria",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${lora.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={true}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
