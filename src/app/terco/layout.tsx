import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terço Sagrado",
  description:
    "Guia passo a passo para rezar o Terço Católico. Mistérios Gozosos, Luminosos, Dolorosos e Gloriosos com todas as orações: Pai Nosso, Ave Maria, Glória e Salve Rainha.",
  keywords: [
    "terço",
    "rosário",
    "rezar terço",
    "mistérios do terço",
    "mistérios gozosos",
    "mistérios luminosos",
    "mistérios dolorosos",
    "mistérios gloriosos",
    "orações católicas",
    "ave maria",
    "pai nosso",
    "salve rainha",
    "guia terço",
  ],
  openGraph: {
    title: "Terço Sagrado · Bíblia Ave Maria",
    description:
      "Guia passo a passo para rezar o Terço Católico com todos os mistérios e orações.",
  },
};

export default function TercoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
