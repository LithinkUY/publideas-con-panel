import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const rows = await sql`SELECT * FROM variants ORDER BY sort_order, id`;
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const { name, description, price_type, price, price_percent, active, sort_order } = await req.json();
    const rows = await sql`
        INSERT INTO variants (name, description, price_type, price, price_percent, active, sort_order)
        VALUES (
            ${name}, ${description ?? ""},
            ${price_type ?? "fixed"}, ${price ?? 0}, ${price_percent ?? 0},
            ${active ?? true}, ${sort_order ?? 0}
        )
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
