import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/payment-gateways/mercadopago/preference
// Crea una preference de MercadoPago y devuelve el init_point (URL de pago)
export async function POST(req: Request) {
    const body = await req.json();
    const { items, payer, external_reference, back_urls, notification_url } = body;

    // Obtener configuración de MercadoPago desde la DB
    const rows = await sql`
        SELECT config, test_mode FROM payment_gateways
        WHERE type = 'mercadopago' AND active = true
        LIMIT 1
    `;

    if (!rows[0]) {
        return NextResponse.json({ error: "MercadoPago no está configurado o activo" }, { status: 400 });
    }

    const cfg = rows[0].config as { access_token?: string };
    const access_token = cfg.access_token;

    if (!access_token) {
        return NextResponse.json({ error: "Access token de MercadoPago no configurado" }, { status: 400 });
    }

    const preference = {
        items: items ?? [],
        payer: payer ?? {},
        external_reference: external_reference ?? "",
        back_urls: back_urls ?? {
            success: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/checkout/success`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/checkout/failure`,
            pending: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/checkout/pending`,
        },
        auto_return: "approved",
        notification_url: notification_url ?? `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/webhooks/mercadopago`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
        const err = await mpRes.text();
        return NextResponse.json({ error: "Error de MercadoPago", detail: err }, { status: 502 });
    }

    const data = await mpRes.json();
    const is_test = rows[0].test_mode as boolean;

    return NextResponse.json({
        preference_id: data.id,
        init_point: is_test ? data.sandbox_init_point : data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        is_test,
    });
}
