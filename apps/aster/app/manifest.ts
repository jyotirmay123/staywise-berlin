import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Aster Portfolio",
    short_name: "Aster",
    description:
      "Offline-first EUR and INR investment portfolio tracker.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#10261f",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
