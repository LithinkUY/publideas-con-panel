import { sql } from "@/lib/db";
import { Page } from "@/lib/types";
import { notFound } from "next/navigation";
import { mockPages } from "@/lib/mock-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let pages: Page[] = [];
    try {
        const rows = await sql`SELECT value FROM site_config WHERE key='pages'`;
        pages = rows[0]?.value ?? mockPages;
    } catch {
        pages = mockPages;
    }

    const page = pages.find((p: Page) => p.slug === slug && p.active);
    
    if (!page) {
        return {
            title: "Página no encontrada | Publideas"
        };
    }

    return {
        title: `${page.title} | Publideas`,
    };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    let pages: Page[] = [];
    try {
        const rows = await sql`SELECT value FROM site_config WHERE key='pages'`;
        pages = rows[0]?.value ?? mockPages;
    } catch {
        pages = mockPages;
    }

    const page = pages.find((p: Page) => p.slug === slug && p.active);

    if (!page) {
        notFound();
    }

    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 bg-[#0a0a0a] pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">{page.title}</h1>
                    <div 
                        className="text-white/80 space-y-4 [&>p]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-[#00CFFF] [&>a]:underline [&>strong]:text-white"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </div>
            </div>
            <Footer />
        </main>
    );
}
