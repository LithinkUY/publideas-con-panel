import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/products/[id]/variants → list linked variant IDs
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`SELECT variant_id FROM product_variants WHERE product_id=${Number(id)}`;
    return NextResponse.json(rows.map((r: Record<string, unknown>) => Number(r.variant_id)));
}

// PUT /api/products/[id]/variants → replace all linked variants
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const variantIds: number[] = await req.json();
    await sql`DELETE FROM product_variants WHERE product_id=${Number(id)}`;
    for (const vid of variantIds) {
        await sql`INSERT INTO product_variants (product_id, variant_id) VALUES (${Number(id)}, ${vid}) ON CONFLICT DO NOTHING`;
    }
    return NextResponse.json({ ok: true });
}
