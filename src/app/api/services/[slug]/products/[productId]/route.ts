import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string; productId: string }> }) {
    const { productId } = await params;
    const body = await req.json();
    const {
        name, description, price, unit, active, sort_order,
        image_url, price_visible, calculator_enabled, price_per_m2, details,
        variant_ids,
    } = body;

    const rows = await sql`
        UPDATE service_products SET
            name=${name}, description=${description ?? ""}, price=${price ?? null},
            unit=${unit ?? "unidad"}, active=${active ?? true}, sort_order=${sort_order ?? 0},
            image_url=${image_url ?? null}, price_visible=${price_visible ?? true},
            calculator_enabled=${calculator_enabled ?? false},
            price_per_m2=${price_per_m2 ?? null},
            details=${JSON.stringify(details ?? [])}::jsonb
        WHERE id=${Number(productId)}
        RETURNING *
    `;

    // Update variants
    await sql`DELETE FROM product_variants WHERE product_id=${Number(productId)}`;
    if (variant_ids?.length) {
        for (const vid of variant_ids) {
            await sql`INSERT INTO product_variants (product_id, variant_id) VALUES (${Number(productId)}, ${vid}) ON CONFLICT DO NOTHING`;
        }
    }

    return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string; productId: string }> }) {
    const { productId } = await params;
    await sql`DELETE FROM service_products WHERE id=${Number(productId)}`;
    return NextResponse.json({ ok: true });
}
