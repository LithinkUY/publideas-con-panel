import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { type, title, subtitle, content, active, sort_order } = body;
    const rows = await sql`
        UPDATE home_sections
        SET type=${type}, title=${title ?? ""}, subtitle=${subtitle ?? ""},
            content=${JSON.stringify(content ?? {})}::jsonb,
            active=${active ?? true}, sort_order=${sort_order ?? 0},
            updated_at=now()
        WHERE id=${Number(id)}
        RETURNING *
    `;
    return NextResponse.json(toJSON(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM home_sections WHERE id=${Number(id)}`;
    return NextResponse.json({ ok: true });
}
