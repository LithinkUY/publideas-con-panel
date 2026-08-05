import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await sql`
            SELECT id, token, title, image_url, active, created_at
            FROM design_samples
            ORDER BY created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error("GET /api/admin/design-samples error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { title, image_url } = await req.json();
        
        if (!title || !image_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate a random unguessable token
        const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

        const result = await sql`
            INSERT INTO design_samples (token, title, image_url)
            VALUES (${token}, ${title}, ${image_url})
            RETURNING id, token, title, image_url, created_at, active
        `;

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("POST /api/admin/design-samples error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await sql`DELETE FROM design_samples WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/admin/design-samples error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
