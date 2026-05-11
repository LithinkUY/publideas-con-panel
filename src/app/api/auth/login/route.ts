import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos." }, { status: 400 });
        }

        // Accept login via password_hash OR pin_code (checkout-created users only have pin_code)
        const rows = await sql`
            SELECT id, name, apellido, email, client_code, pin_code, role, status
            FROM clients
            WHERE email = ${email}
              AND (password_hash = ${password} OR pin_code = ${password})
            LIMIT 1
        `;

        const client = rows[0];
        if (!client) {
            return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
        }

        if (client.status === "pending") {
            return NextResponse.json({ error: "Tu cuenta está pendiente de aprobación." }, { status: 403 });
        }

        return NextResponse.json({
            ok: true,
            session: {
                client_id: client.id,
                client_code: client.client_code,
                name: `${client.name}${client.apellido ? " " + client.apellido : ""}`,
                email: client.email,
                pin_code: client.pin_code,
                role: client.role,
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
