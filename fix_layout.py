content = 'import type { Metadata } from "next";\nimport "./globals.css";\nimport Header from "@/components/Header";\n\nexport const metadata: Metadata = {\n  title: "Portal Autogestion",\n  description: "Portal de autogestion para clientes",\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="es">\n      <body>\n        <Header />\n        <main>{children}</main>\n      </body>\n    </html>\n  );\n}\n'
with open("src/app/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("OK")
