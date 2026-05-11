import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function generatePin(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateClientCode(id: number): string {
    return `PB-${String(id).padStart(4, "0")}`;
}

export async function POST(req: Request) {
    const body = await req.json();
    const { name, email, phone, cart, gateway_type } = body;

    if (!email || !name) {
        return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    // Find or create client by email
    const existing = await sql`SELECT * FROM clients WHERE email = ${email} LIMIT 1`;
    let client = existing[0] as Record<string, unknown> | undefined;
    let isNewClient = false;

    if (!client) {
        isNewClient = true;
        const pin = generatePin();
        const rows = await sql`
            INSERT INTO clients (name, email, phone, pin_code, password_hash, role, status)
            VALUES (${name}, ${email}, ${phone ?? ""}, ${pin}, ${pin}, 'client', 'approved')
            RETURNING *
        `;
        client = rows[0] as Record<string, unknown>;
        const code = generateClientCode(Number(client.id));
        await sql`UPDATE clients SET client_code = ${code} WHERE id = ${Number(client.id)}`;
        client.client_code = code;
        client.pin_code = pin;
    } else {
        // Update name/phone if provided
        await sql`UPDATE clients SET name=${name}, phone=${phone ?? String(client.phone ?? "")} WHERE id=${Number(client.id)}`;
    }

    // Generate order number
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const countRows = await sql`SELECT COUNT(*) as cnt FROM orders WHERE order_number LIKE ${"PB-" + ym + "-%"}`;
    const seq = Number(countRows[0].cnt) + 1;
    const order_number = `PB-${ym}-${String(seq).padStart(4, "0")}`;

    // Determine initial status
    const initialStatus = gateway_type === "mercadopago" ? "pendiente_pago" : "pendiente";

    // Build title and description
    const title = cart.product ?? "Pedido";
    const description = [
        cart.variants?.length ? `Variantes: ${cart.variants.join(", ")}` : "",
        cart.m2 ? `Medidas: ${cart.width}m × ${cart.height}m = ${cart.m2.toFixed(2)}m²` : "",
        cart.notes ? `Notas: ${cart.notes}` : "",
    ].filter(Boolean).join(" | ");

    // Create order
    const orderRows = await sql`
        INSERT INTO orders (
            order_number, client_id, service_slug, title, description,
            status, total, currency, cart_data, contact_email, contact_phone
        ) VALUES (
            ${order_number}, ${Number(client.id)},
            ${String(cart.serviceSlug ?? "")},
            ${title}, ${description},
            ${initialStatus}, ${Number(cart.total ?? 0)},
            ${String(cart.currency ?? "USD")},
            ${JSON.stringify(cart)}::jsonb,
            ${email}, ${phone ?? ""}
        ) RETURNING *
    `;
    const order = orderRows[0] as Record<string, unknown>;

    // Create order item
    if (cart.product) {
        await sql`
            INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal)
            VALUES (${Number(order.id)}, ${cart.product}, ${Number(cart.quantity ?? 1)},
                    ${Number(cart.basePrice ?? 0)}, ${Number(cart.total ?? 0)})
        `;
    }

    return NextResponse.json({
        order_id: order.id,
        order_number,
        client_id: client.id,
        client_code: client.client_code,
        pin_code: client.pin_code,
        client_name: client.name,
        is_new_client: isNewClient,
    }, { status: 201 });
}
