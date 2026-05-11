import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`
        SELECT o.*, c.name as client_name, c.email as client_email,
               c.phone as client_phone, c.client_code, c.pin_code
        FROM orders o
        LEFT JOIN clients c ON c.id = o.client_id
        WHERE o.id = ${Number(id)}
    `;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const items = await sql`SELECT * FROM order_items WHERE order_id=${Number(id)}`;
    const files = await sql`SELECT id, order_id, file_name, file_type, uploaded_by, created_at FROM order_files WHERE order_id=${Number(id)} ORDER BY created_at DESC`;
    const retiros = await sql`SELECT * FROM retiros WHERE order_id=${Number(id)} ORDER BY created_at DESC LIMIT 1`;
    return NextResponse.json(toJSON({ ...rows[0], items, files, retiro: retiros[0] ?? null }));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { status, description, despacho_fecha, despacho_hora, despacho_notas, retiro_id } = body;
    const rows = await sql`
        UPDATE orders SET
            status          = COALESCE(${status ?? null}, status),
            description     = COALESCE(${description ?? null}, description),
            despacho_fecha  = COALESCE(${despacho_fecha ?? null}::date, despacho_fecha),
            despacho_hora   = COALESCE(${despacho_hora ?? null}::time, despacho_hora),
            despacho_notas  = COALESCE(${despacho_notas ?? null}, despacho_notas),
            retiro_id       = COALESCE(${retiro_id ?? null}, retiro_id),
            updated_at      = now()
        WHERE id = ${Number(id)} RETURNING *
    `;
    return NextResponse.json(toJSON(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM orders WHERE id=${Number(id)}`;
    return NextResponse.json({ ok: true });
}
