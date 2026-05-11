import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { name, description, type, price, active, sort_order } = await req.json();
    const rows = await sql`
        UPDATE shipping_types SET
            name        = COALESCE(${name ?? null}, name),
            description = COALESCE(${description ?? null}, description),
            type        = COALESCE(${type ?? null}, type),
            price       = COALESCE(${price ?? null}, price),
            active      = COALESCE(${active ?? null}, active),
            sort_order  = COALESCE(${sort_order ?? null}, sort_order)
        WHERE id = ${Number(id)} RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM shipping_types WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
}
