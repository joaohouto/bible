import type { MetadataRoute } from "next";

// Actualiza SITE_URL com o domínio real antes de fazer deploy
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biblia-ave-maria.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/terco`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/inspiracao`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
