import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET all products for a service
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const rows = await sql`
        SELECT sp.*,
            COALESCE(
                (SELECT json_agg(pv.variant_id) FROM product_variants pv WHERE pv.product_id = sp.id),
                '[]'::json
            ) as variant_ids
        FROM service_products sp
        WHERE sp.service_slug = ${slug}
        ORDER BY sp.sort_order
    `;
    return NextResponse.json(rows);
}

// POST create a new product for a service
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const body = await req.json();
    const {
        name, description, price, unit, active, sort_order,
        image_url, price_visible, calculator_enabled, price_per_m2, details,
        variant_ids,
    } = body;

    const rows = await sql`
        INSERT INTO service_products
            (service_slug, name, description, price, unit, active, sort_order,
             image_url, price_visible, calculator_enabled, price_per_m2, details)
        VALUES (
            ${slug}, ${name}, ${description ?? ""}, ${price ?? null}, ${unit ?? "unidad"},
            ${active ?? true}, ${sort_order ?? 0}, ${image_url ?? null},
            ${price_visible ?? true}, ${calculator_enabled ?? false},
            ${price_per_m2 ?? null}, ${JSON.stringify(details ?? [])}::jsonb
        )
        RETURNING *
    `;
    const product = rows[0];

    // Link variants
    if (variant_ids?.length) {
        for (const vid of variant_ids) {
            await sql`INSERT INTO product_variants (product_id, variant_id) VALUES (${product.id}, ${vid}) ON CONFLICT DO NOTHING`;
        }
    }

    return NextResponse.json(product, { status: 201 });
}
