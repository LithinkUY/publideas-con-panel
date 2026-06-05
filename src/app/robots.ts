import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers();
    const host = headersList.get("host") || "publideasuy.com";
    const protocol = process.env.NODE_ENV === "development" || host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/api/", "/portal", "/checkout", "/pedido", "/proceso"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
