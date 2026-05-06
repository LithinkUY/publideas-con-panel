import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const rows = await sql`SELECT * FROM shipping_agencies WHERE active = true ORDER BY sort_order, id`;
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const { name, description, active, sort_order } = await req.json();
    const rows = await sql`
        INSERT INTO shipping_agencies (name, description, active, sort_order)
        VALUES (${name}, ${description ?? ""}, ${active ?? true}, ${sort_order ?? 0})
        RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
