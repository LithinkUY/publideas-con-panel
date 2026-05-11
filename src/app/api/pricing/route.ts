import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { defaultPricingConfig } from "@/lib/types";

export async function GET() {
    const rows = await sql`SELECT value FROM site_config WHERE key='pricing' LIMIT 1`;
    if (rows.length === 0) return NextResponse.json(defaultPricingConfig);
    return NextResponse.json({ ...defaultPricingConfig, ...rows[0].value });
}

export async function PUT(req: Request) {
    const body = await req.json();
    await sql`
        INSERT INTO site_config (key, value) VALUES ('pricing', ${JSON.stringify(body)}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body)}::jsonb, updated_at = now()
    `;
    return NextResponse.json(body);
}
