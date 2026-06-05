import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function robots(): MetadataRoute.Robots {
    const headersList = headers();
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
