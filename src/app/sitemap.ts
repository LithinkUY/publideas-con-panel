import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function sitemap(): MetadataRoute.Sitemap {
    const headersList = headers();
    const host = headersList.get("host") || "publideasuy.com";
    const protocol = process.env.NODE_ENV === "development" || host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    return [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        // Aquí se pueden agregar otras rutas públicas si existen
    ];
}
