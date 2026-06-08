import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        if (!process.env.CLOUDINARY_URL) {
            return NextResponse.json({ ok: false, error: "No Cloudinary URL configured." }, { status: 400 });
        }

        const cloudinary = await import("cloudinary");
        const v2 = cloudinary.v2;
        v2.config({ cloudinary_url: process.env.CLOUDINARY_URL });

        // 1. Fetch images from Cloudinary in the publideas/media folder
        const result = await v2.api.resources({
            type: "upload",
            prefix: "publideas/media",
            max_results: 500
        });

        const urls: string[] = result.resources.map((r: any) => r.secure_url);

        if (urls.length === 0) {
            return NextResponse.json({ ok: true, message: "No se encontraron imágenes en la nube." });
        }

        // 2. Fetch current gallery config from database
        const rows = await sql`SELECT value FROM site_config WHERE key='gallery'`;
        let galleryConfig = rows.length > 0 ? rows[0].value : { categories: [], items: [] };

        // Asegurarse de que galleryConfig tenga items y categories
        if (!galleryConfig.categories) galleryConfig.categories = [];
        if (!galleryConfig.items) galleryConfig.items = [];

        // 3. Crear una categoría "Imágenes Recuperadas" si no existe
        const recCatId = 'cat_recuperados';
        let recCat = galleryConfig.categories.find((c: any) => c.id === recCatId);
        if (!recCat) {
            recCat = { id: recCatId, name: "Imágenes Recuperadas", order: 99 };
            galleryConfig.categories.push(recCat);
        }

        // 4. Añadir las imágenes que no estén ya en la galería
        const existingUrls = galleryConfig.items.map((i: any) => i.image_url);
        let addedCount = 0;

        urls.forEach((url: string, index: number) => {
            if (!existingUrls.includes(url)) {
                galleryConfig.items.push({
                    id: `g_rec_${Date.now()}_${index}`,
                    category_id: recCatId,
                    image_url: url,
                    title: "Recuperada",
                    order: galleryConfig.items.length + 1,
                    created_at: new Date().toISOString()
                });
                addedCount++;
            }
        });

        if (addedCount === 0) {
            return NextResponse.json({ ok: true, message: "Todas las imágenes de la nube ya estaban en la galería." });
        }

        // 5. Guardar la configuración actualizada en la base de datos
        await sql`
            INSERT INTO site_config (key, value) VALUES ('gallery', ${JSON.stringify(galleryConfig)}::jsonb)
            ON CONFLICT (key) DO UPDATE SET value=${JSON.stringify(galleryConfig)}::jsonb, updated_at=now()
        `;

        return NextResponse.json({ 
            ok: true, 
            message: `Se recuperaron exitosamente ${addedCount} imágenes desde la nube. Revisa la categoría 'Imágenes Recuperadas'.` 
        });

    } catch (error) {
        console.error("Recover gallery error:", error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
