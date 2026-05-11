import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email, pin_code } = await req.json();
    if (!email || !pin_code) {
        return NextResponse.json({ error: "Email y PIN requeridos" }, { status: 400 });
    }
    const rows = await sql`
        SELECT id, name, email, phone, client_code, pin_code, role, created_at
        FROM clients
        WHERE LOWER(email) = LOWER(${email}) AND pin_code = ${String(pin_code).toUpperCase()}
        LIMIT 1
    `;
    if (!rows[0]) {
        return NextResponse.json({ error: "Email o PIN incorrecto" }, { status: 401 });
    }
    return NextResponse.json(rows[0]);
}
