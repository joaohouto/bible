import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bíblia Sagrada",
    short_name: "Bíblia",
    description: "Bíblia Sagrada Edição Ave Maria com leitura offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/api/icon/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icon/512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
