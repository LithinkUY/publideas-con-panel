import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// Generate next order number: PB-YYYYMM-XXXX
async function nextOrderNumber(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const rows = await sql`
        SELECT COUNT(*) as cnt FROM orders
        WHERE order_number LIKE ${"PB-" + ym + "-%"}
    `;
    const seq = Number(rows[0].cnt) + 1;
    return `PB-${ym}-${String(seq).padStart(4, "0")}`;
}

function toJSON(obj: unknown): unknown {
    return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v)));
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");
    try {
        let rows;
        if (clientId) {
            rows = await sql`
                SELECT o.*, c.name as client_name, c.email as client_email, c.client_code
                FROM orders o
                LEFT JOIN clients c ON c.id = o.client_id
                WHERE o.client_id = ${Number(clientId)}
                ORDER BY o.created_at DESC
            `;
        } else {
            rows = await sql`
                SELECT o.*, c.name as client_name, c.email as client_email, c.client_code
                FROM orders o
                LEFT JOIN clients c ON c.id = o.client_id
                ORDER BY o.created_at DESC
                LIMIT 200
            `;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderIds = rows.map((r: any) => r.id as number);
        let files: Array<{ id: number; order_id: number; file_name: string; file_url: string; file_data: string; file_type: string; uploaded_by: string; created_at: string }> = [];
        let orderItems: Array<{ id: number; order_id: number; product_name: string; quantity: number; unit_price: number; subtotal: number }> = [];
        if (orderIds.length > 0) {
            files = await sql`
                SELECT id, order_id, file_name, file_url, file_data, file_type, uploaded_by, created_at
                FROM order_files WHERE order_id = ANY(${orderIds}) ORDER BY created_at ASC
            ` as typeof files;
            orderItems = await sql`
                SELECT id, order_id, product_name, quantity, unit_price, subtotal
                FROM order_items WHERE order_id = ANY(${orderIds})
            ` as typeof orderItems;
        }

        // Retiros
        let retiros: Array<{ order_id: number; tipo: string; bus_company?: string; direccion?: string; horario?: string; receptor?: string; notes?: string }> = [];
        if (orderIds.length > 0) {
            retiros = await sql`SELECT UNNEST(order_ids) as order_id, id, tipo, bus_company, direccion, horario, receptor, notes FROM retiros WHERE order_ids && ${orderIds}::int[] ORDER BY created_at DESC` as typeof retiros;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = rows.map((order: any) => {
            const cartData = order.cart_data ?? {};
            // Build items array from order_items table; fall back to cart_data for display
            const itemsFromTable = orderItems.filter(i => i.order_id === order.id);
            const items = itemsFromTable.length > 0
                ? itemsFromTable.map(i => ({ product: i.product_name, quantity: i.quantity, total: i.subtotal }))
                : (cartData.product ? [{ product: cartData.product, quantity: cartData.quantity ?? 1, total: cartData.total ?? 0, variants: cartData.variants ?? [], notes: cartData.notes ?? "" }] : []);
            return {
                ...order,
                total: order.total ?? 0,
                items,
                order_files: files.filter(f => f.order_id === order.id),
                retiro: retiros.find(r => r.order_id === order.id) ?? null,
            };
        });

        return NextResponse.json(toJSON(result));
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Error loading orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { client_id, service_slug, title, description, status, total, items } = body;
    const order_number = await nextOrderNumber();

    const orderRows = await sql`
        INSERT INTO orders (order_number, client_id, service_slug, title, description, status, total)
        VALUES (${order_number}, ${client_id ?? null}, ${service_slug ?? null},
                ${title}, ${description ?? ""}, ${status ?? "pendiente"}, ${total ?? 0})
        RETURNING *
    `;
    const order = orderRows[0];

    if (items?.length) {
        for (const item of items) {
            await sql`
                INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal)
                VALUES (${order.id}, ${item.product_name}, ${item.quantity ?? 1},
                        ${item.unit_price ?? 0}, ${item.subtotal ?? 0})
            `;
        }
    }

    return NextResponse.json(order, { status: 201 });
}
