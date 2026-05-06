import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const rows = await sql`SELECT * FROM shipping_types ORDER BY sort_order, id`;
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const { name, description, type, price, active, sort_order } = await req.json();
    const rows = await sql`
        INSERT INTO shipping_types (name, description, type, price, active, sort_order)
        VALUES (${name}, ${description ?? ""}, ${type ?? "otro"}, ${price ?? 0}, ${active ?? true}, ${sort_order ?? 0})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
