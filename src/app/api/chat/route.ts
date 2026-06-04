import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not configured.");
            return NextResponse.json({ error: "El asistente no está configurado correctamente." }, { status: 500 });
        }

        // 1. Fetch Context from DB (Services and Products)
        const servicesRows = await sql`
            SELECT s.name as service_name, s.description as service_desc,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'name', sp.name, 
                            'desc', sp.description,
                            'price', sp.price, 
                            'unit', sp.unit,
                            'price_per_m2', sp.price_per_m2,
                            'variants', (
                                SELECT COALESCE(
                                    json_agg(
                                        json_build_object(
                                            'name', v.name,
                                            'price_type', v.price_type,
                                            'price', v.price,
                                            'price_percent', v.price_percent
                                        )
                                    ), '[]'::json
                                )
                                FROM product_variants pv
                                JOIN variants v ON pv.variant_id = v.id
                                WHERE pv.product_id = sp.id AND v.active = true
                            )
                        )
                    ) FILTER (WHERE sp.id IS NOT NULL), '[]'
                ) AS products
            FROM services s
            LEFT JOIN service_products sp ON sp.service_id = s.id
            WHERE s.active = true AND (sp.active = true OR sp.id IS NULL)
            GROUP BY s.id
            ORDER BY s.sort_order
        `;

        let servicesContext = "Catálogo de Servicios y Precios de Publideas:\n\n";
        for (const s of servicesRows) {
            servicesContext += `**Servicio: ${s.service_name}**\n`;
            servicesContext += `Descripción: ${s.service_desc}\n`;
            if (s.products && s.products.length > 0) {
                servicesContext += `Productos:\n`;
                for (const p of s.products) {
                    servicesContext += `- ${p.name}: ${p.desc}. `;
                    if (p.price != null) servicesContext += `Precio Base: $${p.price} USD x ${p.unit || 'unidad'}. `;
                    if (p.price_per_m2 != null) servicesContext += `Precio por m2: $${p.price_per_m2} USD. `;
                    if (p.variants && p.variants.length > 0) {
                        servicesContext += `\n  - Variantes/Opciones: `;
                        for (const v of p.variants) {
                            if (v.price_type === 'fixed') {
                                servicesContext += `[${v.name}: +$${v.price} USD] `;
                            } else {
                                servicesContext += `[${v.name}: +${v.price_percent}%] `;
                            }
                        }
                    }
                    servicesContext += `\n`;
                }
            } else {
                servicesContext += `(No hay productos específicos listados, solicitar cotización).\n`;
            }
            servicesContext += `\n`;
        }

        // 2. Build System Prompt
        const systemPrompt = `
Eres Publito, el asistente virtual oficial de Publideas. Publideas es una empresa uruguaya especializada en impresión de gran formato, corte láser, sublimación, bordado computarizado, entre otros servicios de industrialización de producción publicitaria.
Tu rol es ayudar a los clientes de forma amable, profesional y concisa. Responde siempre en español rioplatense (puedes usar "vos" y ser cercano pero respetuoso).

Tienes acceso al siguiente catálogo de servicios y precios actuales de Publideas:
${servicesContext}

Instrucciones IMPORTANTES:
1. Si el cliente te pide un presupuesto o calcular un precio, utiliza la información del catálogo. 
2. Si es un precio por metro cuadrado (m2), multiplica el ancho por el alto (en metros) por el precio_per_m2.
3. PRESTA MUCHA ATENCIÓN A LAS VARIANTES: Si el cliente pide opciones extra (como ojales, doble cara, laminado UV) y estas figuran en "Variantes/Opciones", debes sumarlas al cálculo final. Si la variante dice "+$X USD", sumas ese monto fijo. Si dice "+X%", calculas ese porcentaje sobre el precio base/m2 y lo sumas.
4. Muestra el cálculo paso a paso brevemente y el total final.
5. DISEÑO GRATIS Y CONTACTO OFICIAL: Cada vez que des un presupuesto, indícale al cliente que tienen diseño gratis y pásale los datos de contacto. Dile exactamente algo similar a esto: "Recuerda que tenemos diseño gratis. Escríbenos a nuestro WhatsApp https://wa.me/59898360725 o al correo info@publideasuy.com, adjunta tu idea o tu logo, y en el momento te crearemos una muestra para que puedas ver cómo quedaría."
6. Mantén tus respuestas en formato Markdown para que sean legibles (usa negritas para precios o servicios importantes).
7. Sé directo pero servicial. No des respuestas exageradamente largas a menos que te pidan muchos detalles.
        `.trim();

        // 3. Format Messages for Gemini API
        // Gemini expects contents: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
        // The very first message will include the system prompt from the 'user' side conceptually, 
        // but wait, Gemini Flash supports 'systemInstruction' property. Let's use systemInstruction if possible, 
        // or just prepend it to the first user message.
        
        // According to Gemini API docs for generateContent:
        // { system_instruction: { parts: { text: "..." } }, contents: [ ... ] }

        // Ensure the conversation starts with a 'user' message and alternates
        let formattedContents = messages.map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }));

        // Remove any leading 'model' messages because Gemini requires the first message to be from 'user'
        while (formattedContents.length > 0 && formattedContents[0].role === "model") {
            formattedContents.shift();
        }

        const requestBody = {
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: formattedContents,
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            return NextResponse.json({ error: "Error de conexión con Publito. Intenta de nuevo más tarde." }, { status: response.status });
        }

        const data = await response.json();
        
        // Parse Gemini response
        const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu solicitud.";

        return NextResponse.json({ content: assistantText });

    } catch (error: any) {
        console.error("[Chat API Error]", error);
        return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
    }
}
