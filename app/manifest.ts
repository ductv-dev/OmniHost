import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OmniHost",
    short_name: "OmniHost",
    description: "Mobile workspace for prepared guest messages.",
    start_url: "/dashboard/generator",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#09090b",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
