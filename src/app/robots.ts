import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://publideas.com.uy";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/api/", "/portal", "/checkout", "/pedido", "/proceso"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
