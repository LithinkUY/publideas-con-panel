import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/services/[slug]/sync
// Replaces ALL products for the service with the provided list.
// This guarantees DB == UI state after every save.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { products } = await req.json() as {
        products: {
            name: string; description: string; price: number | null;
            unit: string; active: boolean; sort_order: number;
            image_url: string | null; price_visible: boolean;
            calculator_enabled: boolean; price_per_m2: number | null;
            details: unknown[]; variant_ids: number[];
        }[]
    };

    // 1. Delete variant associations for all products of this service
    await sql`
        DELETE FROM product_variants
        WHERE product_id IN (SELECT id FROM service_products WHERE service_slug = ${slug})
    `;

    // 2. Delete all products for this service
    await sql`DELETE FROM service_products WHERE service_slug = ${slug}`;

    // 3. Re-insert every product from the current UI state
    const inserted = [];
    for (const p of products ?? []) {
        const rows = await sql`
            INSERT INTO service_products
                (service_slug, name, description, price, unit, active, sort_order,
                 image_url, price_visible, calculator_enabled, price_per_m2, details)
            VALUES (
                ${slug}, ${p.name}, ${p.description ?? ""},
                ${p.price ?? null}, ${p.unit ?? "unidad"},
                ${p.active ?? true}, ${p.sort_order ?? 0},
                ${p.image_url ?? null}, ${p.price_visible ?? true},
                ${p.calculator_enabled ?? false}, ${p.price_per_m2 ?? null},
                ${JSON.stringify(p.details ?? [])}::jsonb
            )
            RETURNING id
        `;
        const productId = rows[0]?.id;
        if (productId && p.variant_ids?.length) {
            for (const vid of p.variant_ids) {
                await sql`
                    INSERT INTO product_variants (product_id, variant_id)
                    VALUES (${productId}, ${vid})
                    ON CONFLICT DO NOTHING
                `;
            }
        }
        inserted.push(productId);
    }

    return NextResponse.json({ ok: true, inserted });
}
