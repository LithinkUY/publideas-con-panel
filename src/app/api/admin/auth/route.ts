import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { password } = await req.json();
    const correct = process.env.ADMIN_PASSWORD ?? "publideas2024";
    if (password === correct) {
        return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
}

export async function PUT(req: Request) {
    // Change admin password — writes to .env.local would require file system access
    // Instead, we store in DB config table
    const { current_password, new_password } = await req.json();
    const correct = process.env.ADMIN_PASSWORD ?? "publideas2024";
    if (current_password !== correct) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
    }
    if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    // Store in config table so it persists
    const { sql } = await import("@/lib/db");
    await sql`
        INSERT INTO config (key, value) VALUES ('admin_password', ${new_password})
        ON CONFLICT (key) DO UPDATE SET value = ${new_password}, updated_at = now()
    `;
    return NextResponse.json({ ok: true });
}
