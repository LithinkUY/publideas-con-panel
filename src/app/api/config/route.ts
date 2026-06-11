import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    if (key) {
        const rows = await sql`SELECT value FROM site_config WHERE key=${key}`;
        return NextResponse.json(rows[0]?.value ?? null);
    }
    const rows = await sql`SELECT key, value FROM site_config`;
    const config: Record<string, unknown> = {};
    for (const r of rows) config[r.key] = r.value;
    return NextResponse.json(config);
}

export async function PUT(req: Request) {
    try {
        const { key, value } = await req.json();
        
        // Ensure value is handled properly for jsonb
        const jsonValue = value !== undefined ? JSON.stringify(value) : null;
        
        await sql`
            INSERT INTO site_config (key, value) 
            VALUES (${key}, ${sql.json(value)})
            ON CONFLICT (key) DO UPDATE SET value=${sql.json(value)}, updated_at=now()
        `;
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("PUT /api/config Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
