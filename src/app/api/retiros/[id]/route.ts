import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, notes } = await req.json();
    const rows = await sql`
        UPDATE retiros SET
            status     = COALESCE(${status ?? null}, status),
            notes      = COALESCE(${notes ?? null}, notes),
            updated_at = now()
        WHERE id = ${Number(id)} RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM retiros WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
}
