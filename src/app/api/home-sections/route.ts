import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function GET() {
    const rows = await sql`SELECT * FROM home_sections ORDER BY sort_order`;
    return NextResponse.json(toJSON(rows));
}

export async function POST(req: Request) {
    const body = await req.json();
    const { type, title, subtitle, content, active, sort_order } = body;
    const rows = await sql`
        INSERT INTO home_sections (type, title, subtitle, content, active, sort_order)
        VALUES (${type ?? "text_block"}, ${title ?? ""}, ${subtitle ?? ""},
                ${JSON.stringify(content ?? {})}::jsonb,
                ${active ?? true}, ${sort_order ?? 0})
        RETURNING *
    `;
    return NextResponse.json(toJSON(rows[0]), { status: 201 });
}
