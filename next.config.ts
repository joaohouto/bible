import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Desativa no dev para não atrapalhar
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        // Intercepta todas as chamadas para a sua API da Bíblia
        urlPattern: /^\/api\/biblia.*/i,
        handler: "CacheFirst", // Como a Bíblia não muda, pega do cache primeiro sempre!
        options: {
          cacheName: "biblia-offline-cache",
          expiration: {
            maxEntries: 1300, // Suficiente para armazenar todos os capítulos (são 1189 na Bíblia) + índices
            maxAgeSeconds: 60 * 60 * 24 * 365, // Guarda por 1 ano offline
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
