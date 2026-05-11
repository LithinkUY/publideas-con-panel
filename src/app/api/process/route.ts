import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const rows = await sql`SELECT * FROM process_steps WHERE active=true ORDER BY sort_order`;
    return NextResponse.json(rows);
}

export async function PUT(req: Request) {
    const steps: { id?: number; icon: string; label: string; description?: string; active: boolean; sort_order: number }[] = await req.json();
    // Replace all steps: delete + re-insert
    await sql`DELETE FROM process_steps`;
    for (const s of steps) {
        await sql`
            INSERT INTO process_steps (icon, label, description, active, sort_order)
            VALUES (${s.icon}, ${s.label}, ${s.description ?? ""}, ${s.active}, ${s.sort_order})
        `;
    }
    return NextResponse.json({ ok: true });
}
