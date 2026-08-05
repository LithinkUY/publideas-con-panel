import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        
        if (!token) {
            return NextResponse.json({ error: "No token provided" }, { status: 400 });
        }

        const rows = await sql`
            SELECT id, title, image_url, active
            FROM design_samples
            WHERE token = ${token}
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: "Sample not found" }, { status: 404 });
        }

        if (!rows[0].active) {
            return NextResponse.json({ error: "This sample is no longer available" }, { status: 410 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("GET /api/design-samples/[token] error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
