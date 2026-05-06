import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`SELECT * FROM payment_gateways WHERE id = ${Number(id)}`;
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toJSON(rows[0]));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { name, type, description, config, active, test_mode, sort_order } = body;
    const rows = await sql`
        UPDATE payment_gateways
        SET name=${name}, type=${type}, description=${description ?? ""},
            config=${JSON.stringify(config ?? {})}::jsonb,
            active=${active ?? false}, test_mode=${test_mode ?? true},
            sort_order=${sort_order ?? 0}, updated_at=now()
        WHERE id = ${Number(id)}
        RETURNING *
    `;
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toJSON(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM payment_gateways WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
}
