import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    try {
        let rows;
        if (status) {
            rows = await sql`
                SELECT id, name, apellido, email, phone, company, razon_social,
                       cedula, direccion, departamento, localidad, asesor,
                       acepta_ofertas, client_code, pin_code, role, status, created_at
                FROM clients WHERE status = ${status}
                ORDER BY created_at DESC
            `;
        } else {
            rows = await sql`
                SELECT id, name, apellido, email, phone, company, razon_social,
                       cedula, direccion, departamento, localidad, asesor,
                       acepta_ofertas, client_code, pin_code, role, status, created_at
                FROM clients
                ORDER BY created_at DESC
            `;
        }
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, apellido = "", email = "", phone = "", company = "",
            razon_social = "", cedula = "", direccion = "", departamento = "",
            localidad = "", asesor = "", acepta_ofertas = true,
            client_code, pin_code, role = "client", status = "approved",
        } = body;

        const rows = await sql`
            INSERT INTO clients
              (name, apellido, email, phone, company, razon_social, cedula,
               direccion, departamento, localidad, asesor, acepta_ofertas,
               client_code, pin_code, role, status)
            VALUES
              (${name}, ${apellido}, ${email}, ${phone}, ${company}, ${razon_social},
               ${cedula}, ${direccion}, ${departamento}, ${localidad}, ${asesor},
               ${acepta_ofertas}, ${client_code ?? null}, ${pin_code ?? null},
               ${role}, ${status})
            RETURNING id, name, email, client_code, status
        `;
        return NextResponse.json(rows[0], { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
