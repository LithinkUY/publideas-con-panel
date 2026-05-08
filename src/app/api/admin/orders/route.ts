import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

function generatePin(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function generateClientCode(id: number): string {
    return `PB-${String(id).padStart(4, "0")}`;
}
function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, email, phone,
            description, currency, status, payment_method, notes,
            total: bodyTotal,
            items,
        } = body as {
            name: string; email: string; phone?: string;
            description?: string; currency?: string; status?: string;
            payment_method?: string; notes?: string; total?: number;
            items?: Array<{ service_name?: string; product_name?: string; quantity?: number; price?: number }>;
        };

        if (!name || !email) {
            return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
        }

        const existing = await sql`SELECT * FROM clients WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
        let client = existing[0] as Record<string, unknown> | undefined;
        let isNewClient = false;
        let pin_code: string | null = null;

        if (!client) {
            isNewClient = true;
            const pin = generatePin();
            pin_code = pin;
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
            pin_code = String(client.pin_code ?? "");
        }

        const now = new Date();
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const countRows = await sql`SELECT COUNT(*) as cnt FROM orders WHERE order_number LIKE ${"PB-" + ym + "-%"}`;
        const seq = Number(countRows[0].cnt) + 1;
        const order_number = `PB-${ym}-${String(seq).padStart(4, "0")}`;

        const orderStatus = status ?? "en_produccion";
        const finalDesc = [description, notes].filter(Boolean).join(" | ");
        const firstItem = items?.[0];
        const title = String(firstItem?.product_name ?? firstItem?.service_name ?? "Pedido manual");
        const serviceSlug = String(firstItem?.service_name ?? "").toLowerCase().replace(/\s+/g, "-");
        const computedTotal = items?.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 1), 0) ?? 0;
        const finalTotal = Number(bodyTotal ?? computedTotal);

        const orderRows = await sql`
            INSERT INTO orders (
                order_number, client_id, service_slug, title, description,
                status, total, currency, payment_method
            ) VALUES (
                ${order_number}, ${Number(client.id)},
                ${serviceSlug}, ${title}, ${finalDesc ?? ""},
                ${orderStatus}, ${finalTotal},
                ${String(currency ?? "USD")}, ${payment_method ?? null}
            ) RETURNING *
        `;
        const order = orderRows[0] as Record<string, unknown>;

        if (items && items.length > 0) {
            for (const it of items) {
                if (it.product_name || it.service_name) {
                    const itemName = String(it.product_name ?? it.service_name ?? "Producto");
                    const qty = Number(it.quantity ?? 1);
                    const price = Number(it.price ?? 0);
                    await sql`
                        INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal)
                        VALUES (${Number(order.id)}, ${itemName}, ${qty}, ${price}, ${price * qty})
                    `;
                }
            }
        }

        return NextResponse.json(toJSON({
            order_id: order.id,
            order_number,
            client_id: client.id,
            client_code: client.client_code,
            pin_code,
            client_name: client.name,
            client_email: client.email,
            is_new_client: isNewClient,
        }), { status: 201 });

    } catch (err) {
        console.error("[admin/orders POST]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error interno al crear el pedido" },
            { status: 500 }
        );
    }
}
