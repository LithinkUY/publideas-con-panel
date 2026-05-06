import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const client_id = searchParams.get("client_id");

    const rows = client_id
        ? await sql`
            SELECT r.*,
                st.name AS shipping_type_name, st.type AS shipping_type_code,
                sa.name AS agency_name
            FROM retiros r
            LEFT JOIN shipping_types st ON st.id = r.shipping_type_id
            LEFT JOIN shipping_agencies sa ON sa.id = r.agency_id
            WHERE r.client_id = ${Number(client_id)}
            ORDER BY r.created_at DESC`
        : await sql`
            SELECT r.*,
                st.name AS shipping_type_name, st.type AS shipping_type_code,
                sa.name AS agency_name,
                c.name AS client_name, c.client_code
            FROM retiros r
            LEFT JOIN shipping_types st ON st.id = r.shipping_type_id
            LEFT JOIN shipping_agencies sa ON sa.id = r.agency_id
            LEFT JOIN clients c ON c.id = r.client_id
            ORDER BY r.created_at DESC`;
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const body = await req.json();
    const {
        client_id, order_ids, tipo, shipping_type_id, agency_id,
        bus_company, direccion, horario, receptor, shipping_cost, notes,
    } = body;

    // Generate retiro number: RT-XXXXX
    const countRows = await sql`SELECT COUNT(*) as c FROM retiros`;
    const n = Number(countRows[0].c) + 1;
    const retiro_number = `RT-${String(n).padStart(5, "0")}`;

    const rows = await sql`
        INSERT INTO retiros (
            retiro_number, client_id, order_ids, tipo,
            shipping_type_id, agency_id, bus_company,
            direccion, horario, receptor, shipping_cost, notes
        ) VALUES (
            ${retiro_number}, ${Number(client_id)}, ${order_ids ?? []},
            ${tipo ?? "retiro"},
            ${shipping_type_id ?? null}, ${agency_id ?? null}, ${bus_company ?? null},
            ${direccion ?? null}, ${horario ?? null}, ${receptor ?? null},
            ${shipping_cost ?? 0}, ${notes ?? null}
        ) RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
}
