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
  title: "Bíblia Ave Maria",
  description: "Sagrada Escritura",
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
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
