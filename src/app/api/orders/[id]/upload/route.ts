import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { file_name, file_data, file_type } = body;

    if (!file_data) return NextResponse.json({ error: "No file data" }, { status: 400 });

    await sql`
        INSERT INTO order_files (order_id, file_name, file_url, file_type, uploaded_by)
        VALUES (${Number(id)}, ${file_name ?? "comprobante"}, ${file_data}, ${file_type ?? "image"}, 'client')
    `;

    // Advance status to comprobante_enviado only if currently pendiente
    await sql`
        UPDATE orders SET status='comprobante_enviado', updated_at=now()
        WHERE id=${Number(id)} AND status IN ('pendiente', 'pendiente_pago')
    `;

    return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // Return full file_url (base64) for a specific file
    const { searchParams } = new URL(_req.url);
    const fileId = searchParams.get("file_id");
    if (fileId) {
        const rows = await sql`SELECT * FROM order_files WHERE id=${Number(fileId)} AND order_id=${Number(id)}`;
        if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(rows[0]);
    }
    const rows = await sql`SELECT id, file_name, file_type, uploaded_by, created_at FROM order_files WHERE order_id=${Number(id)} ORDER BY created_at DESC`;
    return NextResponse.json(rows);
}
