// Tipos de datos principales del sistema

// ── Configuracion de moneda / precios ─────────────────────────
export interface PricingConfig {
    currency: "USD" | "UYU";   // moneda principal de display
    uyu_rate: number;           // cotizacion: 1 USD = X UYU
    show_both: boolean;         // mostrar ambas monedas al cliente
}

export const defaultPricingConfig: PricingConfig = {
    currency: "USD",
    uyu_rate: 43,
    show_both: false,
};

// ── Variantes globales de productos ──────────────────────────
export interface Variant {
    id: number;
    name: string;
    description: string;
    price_type: "fixed" | "percent"; // tipo de precio adicional
    price: number;                   // precio fijo adicional (si price_type="fixed")
    price_percent: number;           // porcentaje sobre base (si price_type="percent")
    active: boolean;
    sort_order: number;
}

// ── Productos de un servicio ──────────────────────────────────
export interface ServiceProduct {
    id: string;
    service_id: string;
    service_slug?: string;
    name: string;
    description: string;
    price?: number;
    unit?: string; // "m²", "unidad", "metros"
    image_url?: string;
    price_visible?: boolean;
    calculator_enabled?: boolean;
    price_per_m2?: number;
    active: boolean;
    order: number;
    sort_order?: number;
    details?: ProductDetail[]; // especificaciones clave-valor
    variant_ids?: number[];
}

export interface ProductDetail {
    label: string; // ej: "Material"
    value: string; // ej: "Lona Blackout 510g"
}

// ── Páginas editables ─────────────────────────────────────────
export interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
    active: boolean;
    show_in_menu: boolean;
    created_at: string;
    updated_at: string;
}

export interface SiteConfig {
    id?: string;
    logo_text: string;
    logo_colors: string[]; // ['cyan', 'magenta', 'yellow', 'white']
    logo_url?: string;        // imagen logo desktop (URL en /uploads/)
    logo_mobile_url?: string; // imagen logo mobile (URL en /uploads/)
    site_favicon_url?: string; // favicon personalizado
    hero_title: string;
    hero_subtitle: string;
    hero_subtitles: string[]; // lista de subtítulos rotativos
    hero_button1_text: string;
    hero_button1_url: string;
    hero_button2_text: string;
    hero_button2_url: string;
    hero_video_url: string;
    nav_items: NavItem[];
    primary_color: string;
    updated_at?: string;
}

export interface NavItem {
    label: string;
    href: string;
    children?: NavItem[];
}

export interface Service {
    id: string;
    slug?: string;       // slug real de la DB (distinto del id numérico)
    name: string;
    description: string;
    image_url: string;
    color: string;
    order: number;
    active: boolean;
    products?: ServiceProduct[]; // productos/variantes del servicio
}

export interface Order {
    id: string;
    order_number: string;
    client_id: string;
    client_name?: string;
    product_name: string;
    total: number;
    currency: string;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
    notes?: string;
}

export type OrderStatus =
    | "pendiente"
    | "pendiente_pago"
    | "comprobante_enviado"
    | "en_produccion"
    | "avisado"
    | "pronto_para_entregar"
    | "entregado"
    | "cancelado";

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    client_code: string;
    pin_code?: string;
    advisor?: string;
    avatar_url?: string;
    role: "client" | "admin";
    created_at: string;
}

export interface PendingPayment {
    id: string;
    client_id: string;
    order_id: string;
    amount: number;
    currency: string;
    due_date: string;
    status: "pendiente" | "pagado" | "vencido";
    description: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pendiente: "Pendiente",
    pendiente_pago: "Esperando Pago",
    comprobante_enviado: "Comprobante Enviado",
    en_produccion: "En Producción",
    avisado: "Avisado",
    pronto_para_entregar: "Listo para Retirar",
    entregado: "Entregado",
    cancelado: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    pendiente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pendiente_pago: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    comprobante_enviado: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    en_produccion: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    avisado: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    pronto_para_entregar: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    entregado: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
};
