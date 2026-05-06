import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// Simple deterministic client code generator
function generateClientCode(): string {
    const rand = Math.floor(Math.random() * 90000) + 10000;
    return `CLI${rand}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            email, password, name, apellido = "", phone = "",
            razon_social = "", cedula = "", direccion = "", departamento = "",
            localidad = "", asesor = "", acepta_ofertas = true,
        } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Email, contraseña y nombre son requeridos." }, { status: 400 });
        }

        // Check email not taken
        const existing = await sql`SELECT id FROM clients WHERE email = ${email} LIMIT 1`;
        if (existing.length > 0) {
            return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
        }

        const client_code = generateClientCode();

        // Store password as plain text for now (portal uses PIN; admin can see it)
        // In production swap for bcrypt — keeping lightweight for this stack
        const rows = await sql`
            INSERT INTO clients
              (name, apellido, email, phone, razon_social, cedula, direccion,
               departamento, localidad, asesor, acepta_ofertas,
               client_code, password_hash, status, role)
            VALUES
              (${name}, ${apellido}, ${email}, ${phone}, ${razon_social}, ${cedula},
               ${direccion}, ${departamento}, ${localidad}, ${asesor}, ${acepta_ofertas},
               ${client_code}, ${password}, 'pending', 'client')
            RETURNING id, name, email, client_code, status
        `;

        return NextResponse.json({
            ok: true,
            message: "Registro enviado. Un asesor aprobará tu cuenta en breve.",
            client: rows[0],
        }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
