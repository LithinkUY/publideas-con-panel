import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "1";
    const rows = await sql`
        SELECT s.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', sp.id, 'service_slug', sp.service_slug,
                        'name', sp.name, 'description', sp.description,
                        'price', sp.price, 'unit', sp.unit, 'active', sp.active,
                        'sort_order', sp.sort_order, 'image_url', sp.image_url,
                        'price_visible', sp.price_visible,
                        'calculator_enabled', sp.calculator_enabled,
                        'price_per_m2', sp.price_per_m2, 'details', sp.details,
                        'variant_ids', (
                            SELECT COALESCE(json_agg(pv.variant_id), '[]'::json)
                            FROM product_variants pv WHERE pv.product_id = sp.id
                        )
                    ) ORDER BY sp.sort_order
                ) FILTER (WHERE sp.id IS NOT NULL), '[]'
            ) AS products
        FROM services s
        LEFT JOIN service_products sp ON sp.service_slug = s.slug
        WHERE (${showAll} OR s.active = true)
        GROUP BY s.id
        ORDER BY s.sort_order
    `;
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const body = await req.json();
    const { slug, name, description, icon, color, sort_order, active } = body;
    const rows = await sql`
        INSERT INTO services (slug, name, description, icon, sort_order, active, color)
        VALUES (${slug}, ${name}, ${description ?? ""}, ${icon ?? ""}, ${sort_order ?? 0}, ${active ?? true}, ${color ?? "#1a2a3a"})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
