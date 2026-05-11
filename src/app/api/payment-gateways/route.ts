import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function GET() {
    const rows = await sql`
        SELECT * FROM payment_gateways ORDER BY sort_order, id
    `;
    return NextResponse.json(toJSON(rows));
}

export async function POST(req: Request) {
    const body = await req.json();
    const { name, type, description, config, active, test_mode, sort_order } = body;
    const rows = await sql`
        INSERT INTO payment_gateways (name, type, description, config, active, test_mode, sort_order)
        VALUES (
            ${name}, ${type}, ${description ?? ""},
            ${JSON.stringify(config ?? {})}::jsonb,
            ${active ?? false}, ${test_mode ?? true}, ${sort_order ?? 0}
        )
        RETURNING *
    `;
    return NextResponse.json(toJSON(rows[0]), { status: 201 });
}
