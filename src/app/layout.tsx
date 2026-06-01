import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://publideas.com.uy"), // Ajusta esta URL si el dominio final en Vercel es diferente
  title: {
    default: "Publideas | Imprenta, Diseño y Cartelería en Uruguay",
    template: "%s | Publideas",
  },
  description: "Soluciones gráficas integrales: imprenta digital, diseño gráfico, gigantografías, y cartelería para tu negocio en Uruguay.",
  keywords: ["imprenta", "diseño gráfico", "cartelería", "Uruguay", "impresión digital", "gigantografías"],
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: "/",
    title: "Publideas | Imprenta y Diseño",
    description: "Soluciones gráficas integrales para tu negocio en Uruguay.",
    siteName: "Publideas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Publideas | Imprenta y Diseño",
    description: "Soluciones gráficas integrales para tu negocio en Uruguay.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
