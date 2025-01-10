import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${headersList.get('x-base-url')}/sitemap.xml`,
  };
}