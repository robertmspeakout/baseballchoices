import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/checkout-canceled"],
      },
    ],
    sitemap: "https://extrabase.app/sitemap.xml",
  };
}
