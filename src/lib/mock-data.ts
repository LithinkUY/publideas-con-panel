// Datos de muestra (mock) para desarrollo sin Supabase aún
import { SiteConfig, Service, Order, Client, PendingPayment, Page } from "./types";

export const mockSiteConfig: SiteConfig = {
    logo_text: "",
    logo_colors: ["#00CFFF", "#E91E8C", "#FFE000", "#FFFFFF"],
    hero_title: "INDUSTRIALIZAMOS\nTU PRODUCCIÓN",
    hero_subtitle: "CORTE LÁSER",
    hero_subtitles: [
        "CORTE LÁSER",
        "IMPRESIÓN GRAN FORMATO",
        "DTF & SUBLIMACIÓN",
        "BORDADO COMPUTARIZADO",
        "IMPRESIÓN ECO UV",
    ],
    hero_button1_text: "Hacé tu pedido aquí →",
    hero_button1_url: "/pedido",
    hero_button2_text: "Solicitar cotización →",
    hero_button2_url: "/cotizacion",
    hero_video_url: "/video/hero.mp4",
    nav_items: [
        { label: "RETIRÁ AQUÍ", href: "/retiro" },
        { label: "HACÉ TU PEDIDO", href: "/pedido" },
        {
            label: "RECURSOS",
            href: "#",
            children: [
                { label: "Guías", href: "/recursos/guias" },
                { label: "Templates", href: "/recursos/templates" },
            ],
        },
        {
            label: "MI PORTAL",
            href: "#",
            children: [
                { label: "Autogestión", href: "/portal" },
                { label: "Mis Pedidos", href: "/portal/pedidos" },
            ],
        },
        { label: "CONTACTO", href: "/contacto" },
    ],
    primary_color: "#00CFFF",
};

export const mockServices: Service[] = [
    {
        id: "1", name: "Sublimación", description: "Color integrado a la tela, no tacto ni relieve. La solución ideal para deportivo, banderas y gorras en volumen.", image_url: "/img/services/sublimacion.jpg", color: "#1a4a2e", order: 1, active: true,
        products: [
            { id: "p1-1", service_id: "1", name: "Bandera Sublimada", description: "Bandera de tela sublimada, colores vibrantes y durables al exterior.", price: 12.5, unit: "unidad", active: true, order: 1, details: [{ label: "Material", value: "Tela bandera 110g" }, { label: "Tamaño estándar", value: "150x100 cm" }] },
            { id: "p1-2", service_id: "1", name: "Remera Sublimada", description: "Estampado full color en remeras deportivas con corte y costura incluido.", price: 8.0, unit: "unidad", active: true, order: 2, details: [{ label: "Material", value: "Polyester 100%" }, { label: "Tallas", value: "XS a XXXL" }] },
        ]
    },
    {
        id: "2", name: "TPU", description: "Parches con relieve, texturas y acabados especiales. Para marcas que no se conforman con lo estándar.", image_url: "/img/services/tpu.jpg", color: "#2a1a4a", order: 2, active: true,
        products: [
            { id: "p2-1", service_id: "2", name: "Parche TPU con relieve", description: "Parche 3D con relieve, aplica heat press.", price: 2.5, unit: "unidad", active: true, order: 1, details: [{ label: "Tamaño máx.", value: "15x10 cm" }, { label: "Colores", value: "Full color" }] },
        ]
    },
    {
        id: "3", name: "Corte y Costura", description: "Confección industrial de punto a punto. Desde el molde hasta el producto terminado, sin tercerizaciones.", image_url: "/img/services/corte.jpg", color: "#1a3a4a", order: 3, active: true,
        products: []
    },
    {
        id: "4", name: "Impresión Eco UV", description: "Impresión directa sobre lonas, mesh y blackout. Ideal para publicidad, locales y eventos con colores intensos.", image_url: "/img/services/impresion.jpg", color: "#4a2a1a", order: 4, active: true,
        products: [
            { id: "p4-1", service_id: "4", name: "Impresión en Lona", description: "Impresión Eco UV sobre lona blackout 510g. Ideal para exterior con refuerzo perimetral y ojetillos.", price: 18.0, unit: "m²", active: true, order: 1, details: [{ label: "Material", value: "Lona Blackout 510g" }, { label: "Acabado", value: "Refuerzo perimetral + ojetillos" }, { label: "Resolución", value: "720 dpi" }] },
            { id: "p4-2", service_id: "4", name: "Impresión en Mesh", description: "Impresión sobre mesh para viento. Deja pasar el aire, ideal para cercos y estadios.", price: 15.0, unit: "m²", active: true, order: 2, details: [{ label: "Material", value: "Mesh 50% perforado" }, { label: "Uso", value: "Exterior" }, { label: "Resolución", value: "720 dpi" }] },
            { id: "p4-3", service_id: "4", name: "Banner Roll-Up", description: "Banner retráctil con estructura de aluminio incluida. Listo para usar en stands y eventos.", price: 45.0, unit: "unidad", active: true, order: 3, details: [{ label: "Tamaño", value: "85x200 cm" }, { label: "Incluye", value: "Estructura aluminio + bolso" }] },
            { id: "p4-4", service_id: "4", name: "Valla publicitaria", description: "Impresión gran formato para valla exterior. Alta durabilidad UV.", price: 22.0, unit: "m²", active: true, order: 4, details: [{ label: "Material", value: "Lona 440g" }, { label: "Laminado", value: "UV exterior" }] },
        ]
    },
    {
        id: "5", name: "Bordado", description: "Acabado premium que dura. Logos y parches con presencia sobre prendas, uniformes y accesorios.", image_url: "/img/services/bordado.jpg", color: "#4a1a2a", order: 5, active: true,
        products: [
            { id: "p5-1", service_id: "5", name: "Logo bordado en pecho", description: "Bordado de logo en pecho de camisa o remera.", price: 3.5, unit: "unidad", active: true, order: 1, details: [{ label: "Tamaño", value: "Hasta 8x8 cm" }, { label: "Colores", value: "Hasta 12 hilos" }] },
        ]
    },
    {
        id: "6", name: "Gran Formato", description: "Impacto visual donde lo necesités. Banners, lonas y vinilos para locales, eventos y campañas.", image_url: "/img/services/granformato.jpg", color: "#1a4a4a", order: 6, active: true,
        products: [
            { id: "p6-1", service_id: "6", name: "Vinilo adhesivo", description: "Vinilo autoadhesivo para vidrieras, paredes y superficies lisas.", price: 20.0, unit: "m²", active: true, order: 1, details: [{ label: "Tipo", value: "Corte o impresión" }, { label: "Aplicación", value: "Interior/Exterior" }] },
            { id: "p6-2", service_id: "6", name: "Tótem publicitario", description: "Estructura doble cara con impresión Eco UV. Autosoporte.", price: 85.0, unit: "unidad", active: true, order: 2, details: [{ label: "Tamaño", value: "60x180 cm" }, { label: "Incluye", value: "Estructura + impresión" }] },
        ]
    },
    {
        id: "7", name: "DTF TextII", description: "Estampado vibrante sin límites de diseño. Fullcolor en cualquier tela, sin límites de diseño.", image_url: "/img/services/dtf.jpg", color: "#4a3a1a", order: 7, active: true,
        products: [
            { id: "p7-1", service_id: "7", name: "Transfer DTF A4", description: "Transfer DTF listo para aplicar. Formato A4.", price: 1.5, unit: "unidad", active: true, order: 1, details: [{ label: "Formato", value: "A4 (21x29.7 cm)" }, { label: "Aplicación", value: "Heat press 160°C / 10s" }] },
            { id: "p7-2", service_id: "7", name: "Transfer DTF A3", description: "Transfer DTF listo para aplicar. Formato A3.", price: 2.8, unit: "unidad", active: true, order: 2, details: [{ label: "Formato", value: "A3 (29.7x42 cm)" }, { label: "Aplicación", value: "Heat press 160°C / 10s" }] },
        ]
    },
];

export const mockClient: Client = {
    id: "1",
    name: "Ruben Gomez",
    email: "publideasuruguay@gmail.com",
    phone: "98360725",
    address: ".",
    client_code: "publideasuy",
    advisor: undefined,
    role: "client",
    created_at: "2024-01-01",
};

export const mockOrders: Order[] = [
    { id: "1", order_number: "ECOUV-12354", client_id: "1", product_name: "lona320x200", total: 64.0, currency: "USD", status: "pronto_para_entregar", created_at: "2026-04-27", updated_at: "2026-04-27" },
    { id: "2", order_number: "ECOUV-12166", client_id: "1", product_name: "320x195", total: 62.4, currency: "USD", status: "entregado", created_at: "2026-04-15", updated_at: "2026-04-15" },
    { id: "3", order_number: "ECOUV-12129", client_id: "1", product_name: "320x195vagoneta", total: 60.8, currency: "USD", status: "entregado", created_at: "2026-04-15", updated_at: "2026-04-15" },
    { id: "4", order_number: "ECOUV-11975", client_id: "1", product_name: "320x100", total: 14.0, currency: "USD", status: "avisado", created_at: "2026-04-06", updated_at: "2026-04-06" },
    { id: "5", order_number: "ECOUV-11838", client_id: "1", product_name: "lonamaisorymulticasas", total: 192.4, currency: "USD", status: "entregado", created_at: "2026-03-31", updated_at: "2026-03-31" },
];

export const mockPayments: PendingPayment[] = [
    { id: "1", client_id: "1", order_id: "1", amount: 64.0, currency: "USD", due_date: "2026-05-10", status: "pendiente", description: "Lona 320x200" },
];

export const mockPages: Page[] = [
    { id: "pg1", title: "Cómo hacer tu pedido", slug: "como-pedir", content: "# Cómo hacer tu pedido\n\nSeguí estos pasos para realizar tu pedido de forma rápida y sencilla...", active: true, show_in_menu: true, created_at: "2026-01-01", updated_at: "2026-01-01" },
    { id: "pg2", title: "Preguntas frecuentes", slug: "faq", content: "# Preguntas frecuentes\n\n**¿Cuáles son los tiempos de entrega?**\nDepende del tipo de trabajo...", active: true, show_in_menu: false, created_at: "2026-01-01", updated_at: "2026-01-01" },
    { id: "pg3", title: "Contacto", slug: "contacto", content: "# Contacto\n\nPodés contactarnos por WhatsApp o email.", active: true, show_in_menu: true, created_at: "2026-01-01", updated_at: "2026-01-01" },
];
