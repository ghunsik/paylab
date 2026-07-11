import type { MetadataRoute } from "next";
import { calculators } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://paylab.kr";
  const fixedRoutes = ["", "/standards", "/methodology", "/privacy", "/terms"];
  return [
    ...fixedRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date("2026-07-11"),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.6,
    })),
    ...calculators.map((calculator) => ({
      url: `${baseUrl}/calculators/${calculator.slug}`,
      lastModified: new Date("2026-07-11"),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
