import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`
        SELECT id, name, apellido, email, phone, company, razon_social,
               cedula, direccion, departamento, localidad, asesor,
               acepta_ofertas, client_code, pin_code, role, status, created_at
        FROM clients WHERE id = ${Number(id)}
    `;
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const {
            name, apellido, email, phone, company, razon_social,
            cedula, direccion, departamento, localidad, asesor,
            acepta_ofertas, pin_code, role, status,
        } = body;

        const rows = await sql`
            UPDATE clients SET
                name          = COALESCE(${name ?? null}, name),
                apellido      = COALESCE(${apellido ?? null}, apellido),
                email         = COALESCE(${email ?? null}, email),
                phone         = COALESCE(${phone ?? null}, phone),
                company       = COALESCE(${company ?? null}, company),
                razon_social  = COALESCE(${razon_social ?? null}, razon_social),
                cedula        = COALESCE(${cedula ?? null}, cedula),
                direccion     = COALESCE(${direccion ?? null}, direccion),
                departamento  = COALESCE(${departamento ?? null}, departamento),
                localidad     = COALESCE(${localidad ?? null}, localidad),
                asesor        = COALESCE(${asesor ?? null}, asesor),
                acepta_ofertas = COALESCE(${acepta_ofertas ?? null}, acepta_ofertas),
                pin_code      = COALESCE(${pin_code ?? null}, pin_code),
                role          = COALESCE(${role ?? null}, role),
                status        = COALESCE(${status ?? null}, status)
            WHERE id = ${Number(id)}
            RETURNING id, name, email, client_code, status
        `;
        if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await sql`DELETE FROM clients WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
}
