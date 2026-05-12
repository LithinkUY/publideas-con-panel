import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// Convierte BigInt y otros tipos no serializables a primitivas JSON
function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const body = await req.json();
    const { name, description, icon, color, active, sort_order } = body;
    const rows = await sql`
        UPDATE services
        SET name=${name}, description=${description ?? ""}, icon=${icon ?? ""},
            color=${color ?? "#1a2a3a"}, active=${active ?? true},
            sort_order=${sort_order ?? 0}, updated_at=now()
        WHERE slug=${slug}
        RETURNING *
    `;
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toJSON(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const errors: string[] = [];
    try {
        await sql`
            DELETE FROM product_variants
            WHERE product_id IN (SELECT id FROM service_products WHERE service_slug=${slug})
        `;
    } catch (e) {
        errors.push("product_variants: " + String(e));
    }
    try {
        await sql`DELETE FROM service_products WHERE service_slug=${slug}`;
    } catch (e) {
        errors.push("service_products: " + String(e));
    }
    try {
        await sql`DELETE FROM services WHERE slug=${slug}`;
    } catch (e) {
        errors.push("services: " + String(e));
        return NextResponse.json({ ok: false, errors }, { status: 500 });
    }
    return NextResponse.json({ ok: true, warnings: errors.length ? errors : undefined });
}
