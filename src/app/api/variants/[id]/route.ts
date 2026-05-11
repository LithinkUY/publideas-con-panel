import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { name, description, price_type, price, price_percent, active, sort_order } = await req.json();
    const rows = await sql`
        UPDATE variants SET
            name=${name}, description=${description ?? ""},
            price_type=${price_type ?? "fixed"},
            price=${price ?? 0}, price_percent=${price_percent ?? 0},
            active=${active ?? true}, sort_order=${sort_order ?? 0}
        WHERE id=${Number(id)} RETURNING *
    `;
    return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM variants WHERE id=${Number(id)}`;
    return NextResponse.json({ ok: true });
}
