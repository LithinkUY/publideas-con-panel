import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

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
    const { key, value } = await req.json();
    await sql`
        INSERT INTO site_config (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value=${JSON.stringify(value)}::jsonb, updated_at=now()
    `;
    return NextResponse.json({ ok: true });
}
