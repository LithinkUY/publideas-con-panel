import { NextResponse } from "next/server";

// POST /api/webhooks/mercadopago
// Recibe notificaciones de MercadoPago
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("[MercadoPago Webhook]", JSON.stringify(body));
        // Aqui puedes actualizar el estado de la orden en la DB
        // según body.type === "payment" y body.data.id
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}
