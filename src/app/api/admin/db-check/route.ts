import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || "(not set)";
    // Mask password for safety
    const masked = dbUrl.replace(/:([^@]+)@/, ':****@');

    try {
        const result = await sql`SELECT 1 as ok`;
        return NextResponse.json({
            status: "connected",
            database_url: masked,
            result
        });
    } catch (e: any) {
        return NextResponse.json({
            status: "error",
            database_url: masked,
            error_code: e.code || "unknown",
            error_message: e.message
        });
    }
}
