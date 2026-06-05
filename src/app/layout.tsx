import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { sql } from "@/lib/db";
import { defaultSeoConfig, SeoConfig } from "@/lib/types";
import Script from "next/script";
import PublitoChat from "@/components/PublitoChat";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let seo = defaultSeoConfig;
  try {
    const rows = await sql`SELECT value FROM site_config WHERE key='seoconfig'`;
    if (rows && rows[0] && rows[0].value) {
      seo = { ...defaultSeoConfig, ...rows[0].value };
    }
  } catch (e) {
    console.error("Error cargando SEO config", e);
  }

  return {
    metadataBase: new URL("https://publideasuy.com"),
    title: {
      default: seo.meta_title,
      template: "%s | " + (seo.meta_title.split("|")[0]?.trim() || "Publideas"),
    },
    description: seo.meta_description,
    keywords: seo.meta_keywords.split(",").map(k => k.trim()).filter(Boolean),
    openGraph: {
      type: "website",
      locale: "es_UY",
      url: "/",
      title: seo.meta_title,
      description: seo.meta_description,
      siteName: seo.meta_title.split("|")[0]?.trim() || "Publideas",
      images: [
        {
          url: "https://publideasuy.com/og-image.jpg", // Idealmente reemplazar por el logo
          width: 1200,
          height: 630,
          alt: seo.meta_title,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: seo.meta_title,
      description: seo.meta_description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let seo = defaultSeoConfig;
  try {
    const rows = await sql`SELECT value FROM site_config WHERE key='seoconfig'`;
    if (rows && rows[0] && rows[0].value) {
      seo = { ...defaultSeoConfig, ...rows[0].value };
    }
  } catch (e) {}

  return (
    <html lang="es">
      <head>
        {seo.ga_id && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${seo.ga_id}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${seo.ga_id}');
              `}
            </Script>
          </>
        )}
        {seo.meta_pixel_id && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${seo.meta_pixel_id}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <PublitoChat />
      </body>
    </html>
  );
}
