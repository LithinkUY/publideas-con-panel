"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    LayoutDashboard, Users, Package, Settings, ChevronRight,
    Edit3, Plus, Trash2, Eye, CheckCircle, XCircle, Upload,
    Image as ImageIcon, Video, FileText, Menu as MenuIcon,
    Palette, ChevronDown, ChevronUp, GripVertical, Globe, Layers, Link, Tag,
    DollarSign, Percent, CreditCard, Building2, Banknote, ToggleLeft, ToggleRight, Truck, Calendar, Clock, Loader2,
} from "lucide-react";
import {
    SiteConfig, Service, ServiceProduct, ProductDetail, Variant, PricingConfig,
    defaultPricingConfig, Page, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from "@/lib/types";
import { formatBoth, variantPriceLabel } from "@/lib/pricing";
import {
    mockSiteConfig, mockServices, mockPages,
} from "@/lib/mock-data";
import {
    ProcessConfig, ProcessStep, defaultProcessConfig,
} from "@/components/ProcessSection";
import { defaultFooterConfig, FooterConfig, SocialLink } from "@/components/Footer";

// ── API helpers ───────────────────────────────────────────────
async function apiGet<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
    return res.json();
}
async function apiPut<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${url} → ${res.status}`);
    return res.json();
}
async function apiPost<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
    return res.json();
}
async function apiDelete(url: string): Promise<void> {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${url} → ${res.status}`);
}

async function loadConfigFromApi(): Promise<SiteConfig> {
    try {
        const val = await apiGet<SiteConfig | null>("/api/config?key=siteconfig");
        return val ? { ...mockSiteConfig, ...val } : mockSiteConfig;
    } catch { return mockSiteConfig; }
}
async function saveConfigToApi(cfg: SiteConfig): Promise<void> {
    await apiPut("/api/config", { key: "siteconfig", value: cfg });
}
async function loadPagesFromApi(): Promise<Page[]> {
    try {
        const val = await apiGet<Page[] | null>("/api/config?key=pages");
        return val ?? mockPages;
    } catch { return mockPages; }
}
async function savePagesToApi(pages: Page[]): Promise<void> {
    await apiPut("/api/config", { key: "pages", value: pages });
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2500);
        return () => clearTimeout(t);
    }, [onDone]);
    return (
        <div className="fixed bottom-6 right-6 z-[999] bg-[#00CFFF] text-black font-bold text-sm px-5 py-3 rounded-xl shadow-2xl animate-bounce">
            {msg}
        </div>
    );
}

// ── Sidebar sections ──────────────────────────────────────────
const ADMIN_SECTIONS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pedidos", label: "Pedidos", icon: Package },
    { id: "nuevo_pedido", label: "Nuevo Pedido Manual", icon: Plus },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "servicios", label: "Servicios & Productos", icon: Settings },
    { id: "variantes", label: "Variantes de Productos", icon: Tag },
    { id: "precios", label: "Moneda & Precios", icon: DollarSign },
    { id: "pagos", label: "Pasarelas de Pago", icon: CreditCard },
    { id: "home", label: "Secciones del Home", icon: Globe },
    { id: "logo", label: "Logo", icon: Palette },
    { id: "menu", label: "Menu de Navegacion", icon: MenuIcon },
    { id: "paginas", label: "Paginas", icon: FileText },
    { id: "sitio", label: "Portada / Hero", icon: Globe },
    { id: "footer", label: "Footer", icon: Link },
];

// ── Dashboard ─────────────────────────────────────────────────
type OrderFile = { id: number; file_name: string; file_data: string; file_type: string; uploaded_by: string; created_at: string };
type OrderItem = { product: string; service: string; quantity: number; total: number; currency: string; variants?: string[]; notes?: string };
type ApiOrder = {
    id: number; order_number: string; client_id: number | null; client_name?: string; client_email?: string; client_code?: string;
    title?: string; description?: string; status: string; total?: number; total_amount?: number; currency?: string;
    payment_method?: string; payment_gateway_id?: number; items?: OrderItem[]; order_files?: OrderFile[]; created_at: string; updated_at?: string;
    retiro_id?: number | null; despacho_fecha?: string | null; despacho_hora?: string | null; despacho_notas?: string | null;
    retiro?: { id: number; tipo: string; bus_company?: string; direccion?: string; horario?: string; receptor?: string; notes?: string } | null;
};
type ApiClient = {
    id: number;
    name: string;
    apellido?: string;
    email?: string;
    phone?: string;
    company?: string;
    razon_social?: string;
    cedula?: string;
    direccion?: string;
    departamento?: string;
    localidad?: string;
    asesor?: string;
    acepta_ofertas?: boolean;
    client_code?: string;
    pin_code?: string;
    role?: string;
    status?: string;
    created_at?: string;
};

function DashboardSection() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    useEffect(() => { apiGet<ApiOrder[]>("/api/orders").then(setOrders).catch(() => { }); }, []);

    const stats = [
        { label: "Pedidos Totales", value: orders.length, color: "#00CFFF" },
        { label: "Entregados", value: orders.filter(o => o.status === "entregado").length, color: "#22c55e" },
        { label: "En Proceso", value: orders.filter(o => ["en_produccion", "pronto_para_entregar"].includes(o.status)).length, color: "#f59e0b" },
        { label: "Pendientes", value: orders.filter(o => o.status === "pendiente").length, color: "#e91e8c" },
    ];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.label} className="portal-card">
                        <p className="text-xs text-white/40 font-semibold tracking-wider mb-2">{s.label.toUpperCase()}</p>
                        <p className="text-4xl font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>
            <div className="portal-card">
                <h3 className="text-sm font-semibold text-white/70 mb-4">Ultimos Pedidos</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#2a2a2a]">
                                {["Orden", "Cliente", "Descripcion", "Total", "Estado"].map(h => (
                                    <th key={h} className="text-left pb-3 text-xs text-white/30 font-medium pr-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {orders.slice(0, 8).map(o => (
                                <tr key={o.id} className="hover:bg-white/[0.02]">
                                    <td className="py-2.5 pr-4 font-mono text-xs text-white/80">{o.order_number}</td>
                                    <td className="py-2.5 pr-4 text-xs text-white/60">{o.client_name ?? "—"}</td>
                                    <td className="py-2.5 pr-4 text-xs text-white/70 max-w-[150px] truncate">{o.title}</td>
                                    <td className="py-2.5 pr-4 text-xs text-white font-medium">US$ {Number(o.total).toFixed(2)}</td>
                                    <td className="py-2.5">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                                            {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr><td colSpan={5} className="py-8 text-center text-xs text-white/20">No hay pedidos aun.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}



// ── Nuevo Pedido Manual ──────────────────────────────────────────────────
type ItemLine = { service_name: string; product_name: string; quantity: string; price: string };

function NuevoPedidoAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [form, setForm] = React.useState({
        name: "", email: "", phone: "",
        description: "", currency: "USD",
        status: "en_produccion", payment_method: "", notes: "",
    });
    const [items, setItems] = React.useState<ItemLine[]>([
        { service_name: "", product_name: "", quantity: "1", price: "" },
    ]);
    const [saving, setSaving] = React.useState(false);
    const [result, setResult] = React.useState<{
        order_number: string; client_code: string; pin_code: string;
        client_name: string; client_email: string; is_new_client: boolean;
    } | null>(null);

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const updateItem = (i: number, k: keyof ItemLine, v: string) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

    const addItem = () =>
        setItems(prev => [...prev, { service_name: "", product_name: "", quantity: "1", price: "" }]);

    const removeItem = (i: number) =>
        setItems(prev => prev.filter((_, idx) => idx !== i));

    const totalCalc = items.reduce(
        (sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 1), 0
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email) { onSave("Nombre y email requeridos"); return; }
        setSaving(true);
        try {
            const res = await apiPost<{
                order_number: string; client_code: string; pin_code: string;
                client_name: string; client_email: string; is_new_client: boolean;
            }>("/api/admin/orders", {
                ...form,
                total: totalCalc,
                items: items.map(it => ({
                    service_name: it.service_name,
                    product_name: it.product_name,
                    quantity: Number(it.quantity) || 1,
                    price: parseFloat(it.price) || 0,
                })),
            });
            setResult(res);
            onSave("Pedido creado: " + res.order_number);
        } catch (e) {
            onSave("Error: " + String(e));
        } finally { setSaving(false); }
    };

    const reset = () => {
        setResult(null);
        setForm({ name: "", email: "", phone: "", description: "", currency: "USD",
            status: "en_produccion", payment_method: "", notes: "" });
        setItems([{ service_name: "", product_name: "", quantity: "1", price: "" }]);
    };

    const STATUS_OPTIONS = [
        ["presupuesto", "Presupuesto"],
        ["pendiente", "Pendiente"],
        ["pendiente_pago", "Pendiente de pago"],
        ["en_produccion", "En producción"],
        ["listo", "Listo para retirar"],
        ["enviado", "Enviado"],
        ["entregado", "Entregado"],
        ["cancelado", "Cancelado"],
    ];

    if (result) return (
        <div className="portal-card max-w-lg mx-auto space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-3xl">✅</div>
            <div>
                <h3 className="text-lg font-black text-white">Pedido creado</h3>
                <p className="text-sm text-white/40 mt-0.5">{result.is_new_client ? "Cliente nuevo creado" : "Cliente existente"}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-5 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                    <span className="text-white/40">N° de pedido</span>
                    <span className="font-black text-[#00CFFF] font-mono">{result.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-white/40">Cliente</span>
                    <span className="text-white font-semibold">{result.client_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-white/40">Email</span>
                    <span className="text-white">{result.client_email}</span>
                </div>
                <div className="border-t border-[#2a2a2a] pt-3 mt-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Credenciales de acceso al portal</p>
                    <div className="flex justify-between text-sm">
                        <span className="text-white/40">Código</span>
                        <span className="font-mono font-bold text-[#E91E8C]">{result.client_code}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-white/40">PIN / Contraseña</span>
                        <span className="font-mono font-bold text-[#00CFFF]">{result.pin_code}</span>
                    </div>
                    {result.is_new_client && <p className="text-[10px] text-amber-400/70 mt-2">⚠️ Estas credenciales solo se muestran ahora. Guardálas o envílas al cliente.</p>}
                    {!result.is_new_client && <p className="text-[10px] text-white/30 mt-2">Cliente existente — PIN no cambió.</p>}
                </div>
            </div>
            <button onClick={reset} className="w-full py-2.5 rounded-xl bg-[#00CFFF]/10 text-[#00CFFF] font-semibold text-sm hover:bg-[#00CFFF]/20 transition-colors">
                Crear otro pedido
            </button>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
            {/* Datos del cliente */}
            <div>
                <h3 className="text-sm font-semibold text-white/70 mb-4">Datos del cliente</h3>
                <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/40 mb-1 block">Nombre *</label>
                            <input value={form.name} onChange={e => set("name", e.target.value)} className="dark-input w-full" placeholder="Juan Pérez" required />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 mb-1 block">Teléfono</label>
                            <input value={form.phone} onChange={e => set("phone", e.target.value)} className="dark-input w-full" placeholder="099 xxx xxx" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-white/40 mb-1 block">Email *</label>
                        <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="dark-input w-full" placeholder="cliente@email.com" required />
                        <p className="text-[10px] text-white/25 mt-1">Si ya existe un cliente con ese email, se le asigna el pedido sin crear uno nuevo.</p>
                    </div>
                </div>
            </div>

            {/* Productos / Servicios */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white/70">Productos / Servicios</h3>
                    <span className="text-xs text-white/30">Total: <span className="font-bold text-[#00CFFF]">{form.currency} {totalCalc.toFixed(2)}</span></span>
                </div>

                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-white/30 font-semibold">PRODUCTO {i + 1}</span>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-white/40 mb-1 block">Servicio</label>
                                    <input value={item.service_name} onChange={e => updateItem(i, "service_name", e.target.value)} className="dark-input w-full text-xs" placeholder="Ej: Lonas, Viniles..." />
                                </div>
                                <div>
                                    <label className="text-[10px] text-white/40 mb-1 block">Producto / Descripción corta</label>
                                    <input value={item.product_name} onChange={e => updateItem(i, "product_name", e.target.value)} className="dark-input w-full text-xs" placeholder="Ej: Lona full color 2x1m" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-white/40 mb-1 block">Cantidad</label>
                                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} className="dark-input w-full text-xs" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-white/40 mb-1 block">Precio unitario ({form.currency})</label>
                                    <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(i, "price", e.target.value)} className="dark-input w-full text-xs" placeholder="0.00" />
                                </div>
                            </div>
                            {item.price && item.quantity && (
                                <p className="text-[10px] text-white/30 text-right">
                                    Subtotal: <span className="text-[#00CFFF] font-bold">{form.currency} {((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}</span>
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addItem}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#3a3a3a] text-white/40 hover:border-[#00CFFF]/50 hover:text-[#00CFFF] transition-all text-xs font-semibold">
                    <Plus size={13} /> Agregar otro producto
                </button>
            </div>

            {/* Opciones del pedido */}
            <div>
                <h3 className="text-sm font-semibold text-white/70 mb-4">Opciones del pedido</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] text-white/40 mb-1 block">Descripción / especificaciones generales</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="dark-input w-full resize-none" placeholder="Medidas, materiales, observaciones generales..." />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-white/40 mb-1 block">Moneda</label>
                            <select value={form.currency} onChange={e => set("currency", e.target.value)} className="dark-input w-full">
                                <option value="USD">USD</option>
                                <option value="UYU">UYU</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 mb-1 block">Estado inicial</label>
                            <select value={form.status} onChange={e => set("status", e.target.value)} className="dark-input w-full">
                                {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-white/40 mb-1 block">Método de pago</label>
                            <input value={form.payment_method} onChange={e => set("payment_method", e.target.value)} className="dark-input w-full" placeholder="Transferencia..." />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-white/40 mb-1 block">Notas internas</label>
                        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="dark-input w-full resize-none" placeholder="Notas solo visibles para el equipo..." />
                    </div>
                </div>
            </div>

            {/* Total y submit */}
            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Total del pedido</p>
                    <p className="text-2xl font-black text-[#00CFFF]">{form.currency} {totalCalc.toFixed(2)}</p>
                </div>
                <p className="text-xs text-white/30">{items.length} producto{items.length !== 1 ? "s" : ""}</p>
            </div>

            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Creando pedido...</> : <><Plus size={16} /> Crear pedido manual</>}
            </button>
        </form>
    );
}

// Dispatch form for admin orders
function DispatchForm({ order, onSaved }: { order: ApiOrder; onSaved: (u: Partial<ApiOrder>) => void }) {
    const [fecha, setFecha] = React.useState(order.despacho_fecha?.slice(0, 10) ?? "");
    const [hora, setHora] = React.useState(order.despacho_hora?.slice(0, 5) ?? "");
    const [notas, setNotas] = React.useState(order.despacho_notas ?? "");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setFecha(order.despacho_fecha?.slice(0, 10) ?? "");
        setHora(order.despacho_hora?.slice(0, 5) ?? "");
        setNotas(order.despacho_notas ?? "");
    }, [order.id, order.despacho_fecha, order.despacho_hora, order.despacho_notas]);

    const save = async () => {
        setSaving(true);
        try {
            const updated = await apiPut<Partial<ApiOrder>>(`/api/orders/${order.id}`, {
                despacho_fecha: fecha || null,
                despacho_hora: hora || null,
                despacho_notas: notas || null,
            });
            onSaved(updated);
        } catch (e) { alert("Error: " + String(e)); }
        finally { setSaving(false); }
    };
    const retiro = order.retiro;
    return (
        <div className="border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Truck size={12} /> Despacho / Envío
            </p>
            {retiro && (
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-xs space-y-1">
                    <p className="text-white/50 font-semibold mb-1">Método elegido por el cliente:</p>
                    <p className="text-white"><span className="text-white/40">Tipo:</span> {retiro.tipo === "retiro" ? "Retiro en local" : retiro.tipo === "envio_agencia" ? "Envío por agencia" : retiro.tipo === "envio_domicilio" ? "Envío a domicilio" : retiro.tipo}</p>
                    {retiro.bus_company && <p className="text-white"><span className="text-white/40">Empresa:</span> {retiro.bus_company}</p>}
                    {retiro.direccion && <p className="text-white"><span className="text-white/40">Dirección:</span> {retiro.direccion}</p>}
                    {retiro.receptor && <p className="text-white"><span className="text-white/40">Receptor:</span> {retiro.receptor}</p>}
                    {retiro.horario && <p className="text-white"><span className="text-white/40">Horario:</span> {retiro.horario}</p>}
                    {retiro.notes && <p className="text-white/50 italic">&#34;{retiro.notes}&#34;</p>}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-white/40 mb-1 flex items-center gap-1.5"><Calendar size={10} /> Fecha despacho</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="dark-input py-1.5 text-xs w-full" />
                </div>
                <div>
                    <label className="text-[10px] text-white/40 mb-1 flex items-center gap-1.5"><Clock size={10} /> Hora</label>
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="dark-input py-1.5 text-xs w-full" />
                </div>
            </div>
            <div>
                <label className="text-[10px] text-white/40 mb-1 block">Notas de despacho</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className="dark-input text-xs resize-none w-full" placeholder="Ej: Enviado por Abitab, código 12345..." />
            </div>
            {(fecha || hora || notas) && (
                <div className="text-[10px] text-emerald-400/70 bg-emerald-400/5 rounded-lg px-3 py-2 flex items-center gap-3">
                    {fecha && <span>📅 {new Date(fecha + "T12:00:00").toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long" })}</span>}
                    {hora && <span>🕐 {hora}</span>}
                </div>
            )}
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar info de despacho"}
            </button>
        </div>
    );
}
function OrdersAdmin() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(() => {
        setLoading(true);
        apiGet<ApiOrder[]>("/api/orders")
            .then(setOrders)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => { reload(); }, [reload]);

    const changeStatus = async (id: number, status: string) => {
        try {
            await apiPut(`/api/orders/${id}`, { status });
            setOrders(prev => prev.map(x => x.id === id ? { ...x, status } : x));
        } catch (e) { alert("Error al cambiar estado: " + String(e)); }
    };

    const deleteOrder = async (id: number) => {
        if (!confirm("¿Eliminar este pedido?")) return;
        try {
            await apiDelete(`/api/orders/${id}`);
            setOrders(prev => prev.filter(x => x.id !== id));
        } catch (e) { alert("Error al eliminar: " + String(e)); }
    };

    const downloadFile = (f: { file_name: string; file_data: string }) => {
        const a = document.createElement("a");
        a.href = f.file_data;
        a.download = f.file_name;
        a.click();
    };

    const formatAmt = (amount: number, currency = "USD") => {
        if (!amount) return "–";
        if (currency === "UYU") return `$${Number(amount).toLocaleString("es-UY", { minimumFractionDigits: 0 })}`;
        return `US$ ${Number(amount).toFixed(2)}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">Gestión de Pedidos</h3>
                <button onClick={reload} className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                    ↻ Actualizar
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12 text-white/20 text-sm">Cargando...</div>
            )}

            {!loading && orders.length === 0 && (
                <div className="portal-card text-center py-12 text-xs text-white/20">No hay pedidos aún.</div>
            )}

            <div className="space-y-2">
                {orders.map(o => {
                    const isOpen = expandedId === o.id;
                    const files = (o as ApiOrder & { order_files?: Array<{ id: number; file_name: string; file_data: string; file_type: string; uploaded_by: string; created_at: string }> }).order_files ?? [];
                    const items = (o as ApiOrder & { items?: Array<{ product: string; service: string; quantity: number; total: number; currency: string; variants?: string[]; notes?: string }> }).items ?? [];
                    const statusColor = ORDER_STATUS_COLORS[o.status as keyof typeof ORDER_STATUS_COLORS] ?? "bg-white/10 text-white/60 border-white/20";
                    return (
                        <div key={o.id} className="portal-card !p-0 overflow-hidden">
                            {/* Header row */}
                            <button
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedId(isOpen ? null : o.id)}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                        <span className="font-black text-[#00CFFF] font-mono text-sm">{o.order_number ?? `#${o.id}`}</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                            <span className="w-1 h-1 rounded-full bg-current" />
                                            {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                                        </span>
                                        {files.length > 0 && (
                                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                                📎 {files.length} archivo(s)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-white/40">
                                        <span>{o.client_name ?? "—"}</span>
                                        <span>{new Date(o.created_at).toLocaleDateString("es-UY")}</span>
                                        <span className="font-semibold text-white">{formatAmt(o.total_amount ?? o.total ?? 0, o.currency)}</span>
                                        <span className="text-white/30">{o.payment_method ?? ""}</span>
                                    </div>
                                </div>
                                <ChevronDown size={14} className={`text-white/30 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Expanded detail */}
                            {isOpen && (
                                <div className="border-t border-[#2a2a2a] p-4 space-y-4">
                                    {/* Status change */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider flex-shrink-0">Cambiar estado:</label>
                                        <select value={o.status}
                                            onChange={e => changeStatus(o.id, e.target.value)}
                                            className="dark-input py-1 px-2 text-xs flex-1 max-w-xs">
                                            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Items */}
                                    {items.length > 0 && (
                                        <div>
                                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Productos</p>
                                            <div className="space-y-2">
                                                {items.map((item, i) => (
                                                    <div key={i} className="flex items-start justify-between gap-3 bg-[#1a1a1a] rounded-xl p-3">
                                                        <div>
                                                            <p className="text-xs font-semibold text-white">{item.product}</p>
                                                            <p className="text-[10px] text-white/40">{item.service}</p>
                                                            {item.variants && item.variants.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {item.variants.map((v: string, j: number) => (
                                                                        <span key={j} className="text-[9px] bg-[#2a2a2a] text-white/40 px-1.5 py-0.5 rounded">{v}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {item.notes && <p className="text-[10px] text-white/30 italic mt-0.5">"{item.notes}"</p>}
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-[10px] text-white/30">×{item.quantity}</p>
                                                            <p className="text-xs font-bold text-[#00CFFF]">{formatAmt(item.total, item.currency)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Files */}
                                    {files.length > 0 && (
                                        <div>
                                            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Archivos adjuntos</p>
                                            <div className="space-y-1.5">
                                                {files.map(f => (
                                                    <div key={f.id} className="flex items-center justify-between gap-2 bg-[#1a1a1a] rounded-xl p-3">
                                                        <div>
                                                            <p className="text-xs text-white font-semibold">{f.file_name}</p>
                                                            <p className="text-[10px] text-white/30">
                                                                {f.uploaded_by === "client" ? "Del cliente" : "Del equipo"} · {new Date(f.created_at).toLocaleDateString("es-UY")}
                                                            </p>
                                                        </div>
                                                        <button onClick={() => downloadFile(f)}
                                                            className="flex items-center gap-1 text-[10px] text-[#00CFFF] hover:text-[#00CFFF]/70 transition-colors">
                                                            ↓ Descargar
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Despacho */}
                                    <DispatchForm order={o} onSaved={(updated) => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ...updated } : x))} />

                                    {/* Actions */}
                                    <div className="flex justify-end pt-2 border-t border-[#1a1a1a]">
                                        <button onClick={() => deleteOrder(o.id)}
                                            className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                                            <Trash2 size={13} /> Eliminar pedido
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ── Product editor (dentro de un servicio) ────────────────────
function ProductEditor({
    product, onChange, onRemove, allVariants,
}: {
    product: ServiceProduct;
    onChange: (p: ServiceProduct) => void;
    onRemove: () => void;
    allVariants: Variant[];
}) {
    const [expanded, setExpanded] = useState(false);

    const updateDetail = (i: number, field: keyof ProductDetail, val: string) => {
        const details = [...(product.details ?? [])];
        details[i] = { ...details[i], [field]: val };
        onChange({ ...product, details });
    };
    const addDetail = () => onChange({ ...product, details: [...(product.details ?? []), { label: "", value: "" }] });
    const removeDetail = (i: number) => onChange({ ...product, details: (product.details ?? []).filter((_, j) => j !== i) });

    const handleImage = async (file: File) => {
        const b64 = await fileToBase64(file);
        onChange({ ...product, image_url: b64 });
    };

    const toggleVariant = (vid: number) => {
        const ids = product.variant_ids ?? [];
        const next = ids.includes(vid) ? ids.filter(x => x !== vid) : [...ids, vid];
        onChange({ ...product, variant_ids: next });
    };

    return (
        <div className="bg-[#111] rounded-xl border border-[#2a2a2a] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical size={14} className="text-white/20 flex-shrink-0" />
                <button
                    className={`w-5 h-5 rounded-full flex-shrink-0 border-2 transition-all ${product.active ? "border-green-400 bg-green-400/20" : "border-white/20"}`}
                    onClick={() => onChange({ ...product, active: !product.active })}
                    title={product.active ? "Desactivar" : "Activar"}
                />
                <input
                    value={product.name}
                    onChange={e => onChange({ ...product, name: e.target.value })}
                    className="flex-1 bg-transparent text-sm font-semibold text-white border-b border-transparent focus:border-[#00CFFF]/50 outline-none py-0.5 min-w-0"
                    placeholder="Nombre del producto"
                />
                <button onClick={() => setExpanded(!expanded)} className="text-white/30 hover:text-white flex-shrink-0">
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <button onClick={onRemove} className="text-white/20 hover:text-red-400 flex-shrink-0">
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Detalle expandido */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-[#2a2a2a] pt-3">
                    <textarea
                        value={product.description}
                        onChange={e => onChange({ ...product, description: e.target.value })}
                        rows={2}
                        className="dark-input text-xs resize-none"
                        placeholder="Descripcion del producto"
                    />

                    {/* Imagen */}
                    <label className="cursor-pointer flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-lg border-2 border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/50 flex items-center justify-center overflow-hidden flex-shrink-0"
                            style={{ background: product.image_url ? "none" : "#1a1a1a" }}
                        >
                            {product.image_url
                                ? <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                : <ImageIcon size={18} className="text-white/20" />}
                        </div>
                        <span className="text-xs text-white/30">Imagen del producto</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
                    </label>

                    {/* Precio */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">PRECIO BASE</label>
                            <input
                                value={product.price ?? ""}
                                onChange={e => onChange({ ...product, price: parseFloat(e.target.value) || undefined })}
                                className="dark-input text-xs"
                                placeholder="0.00" type="number" step="0.01"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">UNIDAD</label>
                            <input
                                value={product.unit ?? ""}
                                onChange={e => onChange({ ...product, unit: e.target.value })}
                                className="dark-input text-xs"
                                placeholder="unidad / m² / metros"
                            />
                        </div>
                    </div>

                    {/* Toggles precio visible + calculadora */}
                    <div className="flex gap-4 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <button
                                type="button"
                                onClick={() => onChange({ ...product, price_visible: !(product.price_visible ?? true) })}
                                className={`w-8 h-4 rounded-full transition-colors relative ${(product.price_visible ?? true) ? "bg-[#00CFFF]" : "bg-[#2a2a2a]"}`}
                            >
                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${(product.price_visible ?? true) ? "left-4" : "left-0.5"}`} />
                            </button>
                            <span className="text-xs text-white/50">Mostrar precio al cliente</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <button
                                type="button"
                                onClick={() => onChange({ ...product, calculator_enabled: !product.calculator_enabled })}
                                className={`w-8 h-4 rounded-full transition-colors relative ${product.calculator_enabled ? "bg-[#E91E8C]" : "bg-[#2a2a2a]"}`}
                            >
                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${product.calculator_enabled ? "left-4" : "left-0.5"}`} />
                            </button>
                            <span className="text-xs text-white/50">Calculadora por m²</span>
                        </label>
                    </div>

                    {/* Precio por m2 (solo si calculadora ON) */}
                    {product.calculator_enabled && (
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">PRECIO POR M² (US$)</label>
                            <input
                                value={product.price_per_m2 ?? ""}
                                onChange={e => onChange({ ...product, price_per_m2: parseFloat(e.target.value) || undefined })}
                                className="dark-input text-xs"
                                placeholder="Ej: 12.50" type="number" step="0.01"
                            />
                        </div>
                    )}

                    {/* Variantes */}
                    {allVariants.length > 0 && (
                        <div>
                            <p className="text-[10px] text-white/30 font-semibold tracking-wider mb-2">OPCIONES / VARIANTES</p>
                            <div className="flex flex-wrap gap-2">
                                {allVariants.filter(v => v.active).map(v => {
                                    const selected = (product.variant_ids ?? []).includes(v.id);
                                    const priceTag = v.price_type === "percent"
                                        ? `+${v.price_percent}%`
                                        : v.price > 0 ? `+$${v.price}` : "";
                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => toggleVariant(v.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selected ? "bg-[#E91E8C]/20 border-[#E91E8C] text-[#E91E8C]" : "bg-transparent border-[#2a2a2a] text-white/40 hover:border-[#E91E8C]/50"}`}
                                        >
                                            {v.name}{priceTag && <span className="ml-1 opacity-70">{priceTag}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Especificaciones */}
                    <div>
                        <p className="text-[10px] text-white/30 font-semibold tracking-wider mb-2">ESPECIFICACIONES</p>
                        <div className="space-y-1.5">
                            {(product.details ?? []).map((d, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input value={d.label} onChange={e => updateDetail(i, "label", e.target.value)} className="dark-input py-1 text-xs flex-1" placeholder="Ej: Material" />
                                    <input value={d.value} onChange={e => updateDetail(i, "value", e.target.value)} className="dark-input py-1 text-xs flex-1" placeholder="Ej: Lona 510g" />
                                    <button onClick={() => removeDetail(i)} className="text-white/20 hover:text-red-400 flex-shrink-0"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addDetail} className="mt-2 flex items-center gap-1.5 text-[11px] text-[#00CFFF]/70 hover:text-[#00CFFF]">
                            <Plus size={11} /> Agregar especificacion
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Servicios + Productos ─────────────────────────────────────
function ServicesAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [list, setList] = useState<Service[]>([]);
    const [allVariants, setAllVariants] = useState<Variant[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiGet<Variant[]>("/api/variants").then(setAllVariants).catch(() => { });
        apiGet<unknown[]>("/api/services")
            .then(rows => setList(rows.map(raw => {
                const r = raw as Record<string, unknown>;
                return {
                    id: String(r.id ?? ""),
                    slug: String(r.slug ?? ""),
                    name: String(r.name ?? ""),
                    description: String(r.description ?? ""),
                    image_url: String(r.icon ?? r.image_url ?? ""),
                    color: String(r.color ?? "#1a2a3a"),
                    order: Number(r.sort_order ?? 0),
                    active: Boolean(r.active),
                    products: Array.isArray(r.products) ? (r.products as unknown[]).map(raw2 => {
                        const p = raw2 as Record<string, unknown>;
                        return {
                            id: String(p.id ?? ""),
                            service_id: String(r.id ?? ""),
                            name: String(p.name ?? ""),
                            description: String(p.description ?? ""),
                            price: p.price != null ? Number(p.price) : undefined,
                            unit: p.unit ? String(p.unit) : undefined,
                            image_url: p.image_url ? String(p.image_url) : undefined,
                            price_visible: p.price_visible !== false,
                            calculator_enabled: Boolean(p.calculator_enabled),
                            price_per_m2: p.price_per_m2 != null ? Number(p.price_per_m2) : undefined,
                            active: Boolean(p.active),
                            order: Number(p.sort_order ?? p.order ?? 0),
                            sort_order: Number(p.sort_order ?? 0),
                            details: Array.isArray(p.details) ? p.details as ProductDetail[] : [],
                            variant_ids: Array.isArray(p.variant_ids) ? (p.variant_ids as number[]) : [],
                        } as ServiceProduct;
                    }) : [],
                };
            })))
            .catch(() => setList(mockServices));
    }, []);

    const updateField = (id: string, field: keyof Service, value: unknown) => {
        setList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleServiceImage = async (id: string, file: File) => {
        const b64 = await fileToBase64(file);
        updateField(id, "image_url", b64);
    };

    const addService = () => {
        const tempId = `new_${Date.now()}`;
        const ns: Service = {
            id: tempId, slug: "", name: "Nuevo Servicio", description: "Descripcion",
            image_url: "", color: "#1a2a3a", order: list.length + 1, active: true, products: [],
        };
        setList(prev => [...prev, ns]);
        setExpandedId(ns.id);
    };

    const addProduct = (serviceId: string) => {
        const np: ServiceProduct = {
            id: `p${Date.now()}`, service_id: serviceId, name: "Nuevo producto",
            description: "", active: true, order: 1, price: 0, unit: "unidad", details: [],
        };
        setList(prev => prev.map(s => s.id === serviceId ? { ...s, products: [...(s.products ?? []), np] } : s));
    };

    const updateProduct = (serviceId: string, product: ServiceProduct) => {
        setList(prev => prev.map(s => s.id === serviceId
            ? { ...s, products: (s.products ?? []).map(p => p.id === product.id ? product : p) }
            : s));
    };

    const removeProduct = (serviceId: string, productId: string) => {
        setList(prev => prev.map(s => s.id === serviceId
            ? { ...s, products: (s.products ?? []).filter(p => p.id !== productId) }
            : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const s of list) {
                const body = {
                    name: s.name, description: s.description,
                    icon: s.image_url, active: s.active, sort_order: s.order,
                    color: s.color,
                };
                // Determine if this is an existing DB service (has a real slug)
                const isNew = !s.slug || s.id.startsWith("new_");
                let serviceSlug = s.slug || s.id;

                if (isNew) {
                    // Generate slug from name
                    const autoSlug = s.name
                        .toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                        || `servicio-${Date.now()}`;
                    const created = await apiPost<{ slug?: string; id?: string }>("/api/services", { slug: autoSlug, ...body });
                    serviceSlug = String(created.slug ?? created.id ?? autoSlug);
                    // Update local state so next saves use the real slug
                    setList(prev => prev.map(x => x.id === s.id ? { ...x, slug: serviceSlug } : x));
                } else {
                    await apiPut(`/api/services/${serviceSlug}`, body);
                }

                // Save each product
                for (const p of s.products ?? []) {
                    const productBody = {
                        name: p.name, description: p.description ?? "",
                        price: p.price ?? null, unit: p.unit ?? "unidad",
                        active: p.active, sort_order: p.sort_order ?? p.order ?? 0,
                        image_url: p.image_url ?? null,
                        price_visible: p.price_visible ?? true,
                        calculator_enabled: p.calculator_enabled ?? false,
                        price_per_m2: p.price_per_m2 ?? null,
                        details: p.details ?? [],
                        variant_ids: p.variant_ids ?? [],
                    };
                    const numId = Number(p.id);
                    const isNewProduct = p.id.startsWith("p") || isNaN(numId) || numId <= 0;
                    if (!isNewProduct) {
                        await apiPut(`/api/services/${serviceSlug}/products/${p.id}`, productBody);
                    } else {
                        await apiPost(`/api/services/${serviceSlug}/products`, productBody);
                    }
                }
            }
            onSave("Servicios y productos guardados ✓");
        } catch (e) {
            onSave("Error al guardar: " + String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">Servicios del Slider &amp; sus Productos</h3>
                <button onClick={addService} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                    <Plus size={14} /> Nuevo Servicio
                </button>
            </div>

            {list.map((s, i) => (
                <div key={s.id} className="portal-card !p-0 overflow-hidden">
                    {/* Cabecera del servicio */}
                    <div className="flex gap-3 p-4 items-center">
                        <label className="cursor-pointer flex-shrink-0 group">
                            <div
                                className="w-14 h-14 rounded-lg border-2 border-dashed border-[#3a3a3a] group-hover:border-[#00CFFF]/50 overflow-hidden flex items-center justify-center relative"
                                style={{ background: s.image_url ? "none" : s.color }}
                            >
                                {s.image_url
                                    ? <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                                    : <ImageIcon size={18} className="text-white/30" />}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                    <Upload size={14} className="text-white" />
                                </div>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleServiceImage(s.id, e.target.files[0])} />
                        </label>

                        <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <input value={s.name} onChange={e => updateField(s.id, "name", e.target.value)} className="dark-input py-1.5 text-sm font-semibold flex-1" placeholder="Nombre" />
                                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                                    <input type="color" value={s.color} onChange={e => updateField(s.id, "color", e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                    <span className="text-[10px] text-white/30">color</span>
                                </label>
                                <span className="text-xs text-white/20 flex-shrink-0">#{i + 1}</span>
                            </div>
                            <textarea value={s.description} onChange={e => updateField(s.id, "description", e.target.value)} rows={1} className="dark-input text-xs resize-none" placeholder="Descripcion" />
                        </div>

                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <button onClick={() => updateField(s.id, "active", !s.active)} className={s.active ? "text-green-400" : "text-white/20"}>
                                {s.active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            </button>
                            <button onClick={() => setList(prev => prev.filter(x => x.id !== s.id))} className="text-white/20 hover:text-red-400">
                                <Trash2 size={15} />
                            </button>
                        </div>

                        <button
                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E91E8C]/10 text-[#E91E8C] text-xs font-semibold hover:bg-[#E91E8C]/20 transition-colors"
                        >
                            <Package size={13} />
                            {(s.products ?? []).length} prod.
                            {expandedId === s.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>

                    {/* Panel de productos */}
                    {expandedId === s.id && (
                        <div className="border-t border-[#2a2a2a] bg-[#0d0d0d] p-4 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-white/40 font-semibold tracking-wider">PRODUCTOS DE &quot;{s.name.toUpperCase()}&quot;</p>
                                <button onClick={() => addProduct(s.id)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E91E8C]/10 text-[#E91E8C] text-xs font-semibold hover:bg-[#E91E8C]/20 transition-colors">
                                    <Plus size={12} /> Agregar producto
                                </button>
                            </div>
                            {(s.products ?? []).length === 0 && (
                                <p className="text-xs text-white/20 text-center py-4">Sin productos. Hace clic en &quot;Agregar producto&quot; para comenzar.</p>
                            )}
                            {(s.products ?? []).map(p => (
                                <ProductEditor
                                    key={p.id}
                                    product={p}
                                    allVariants={allVariants}
                                    onChange={updated => updateProduct(s.id, updated)}
                                    onRemove={() => removeProduct(s.id, p.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Servicios y Productos"}
            </button>
        </div>
    );
}

// ── Logo Editor ───────────────────────────────────────────────
function LogoAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<SiteConfig>(mockSiteConfig);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const COLOR_LABELS = ["Cian", "Magenta", "Amarillo", "Blanco/Acento"];

    useEffect(() => { loadConfigFromApi().then(setCfg); }, []);

    const uploadFile = async (file: File, type: string): Promise<string> => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Error al subir archivo");
        const { url } = await res.json();
        return url;
    };

    const handleLogoImage = async (file: File) => {
        setUploading("logo");
        try {
            const url = await uploadFile(file, "logo");
            setCfg(prev => ({ ...prev, logo_url: url }));
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setUploading(null); }
    };

    const handleMobileLogo = async (file: File) => {
        setUploading("logo_mobile");
        try {
            const url = await uploadFile(file, "logo_mobile");
            setCfg(prev => ({ ...prev, logo_mobile_url: url }));
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setUploading(null); }
    };

    const handleFavicon = async (file: File) => {
        setUploading("favicon");
        try {
            await uploadFile(file, "favicon");
            onSave("Favicon actualizado ✓ — recargá la página para verlo en la pestaña");
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setUploading(null); }
    };

    const handleSave = async () => {
        setSaving(true);
        try { await saveConfigToApi(cfg); onSave("Logo guardado ✓"); }
        catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className="max-w-2xl space-y-6">

            {/* ── Logo imagen Desktop ── */}
            <div className="portal-card space-y-4">
                <h3 className="text-sm font-semibold text-white/70">Logo Imagen — Desktop</h3>
                <p className="text-xs text-white/40">Si subís una imagen reemplaza el logo de texto. Recomendado: PNG transparente, máx 400px ancho.</p>
                <div className="flex items-center gap-4">
                    <div className="w-44 h-16 rounded-xl border border-[#2a2a2a] bg-black flex items-center justify-center overflow-hidden flex-shrink-0 px-3">
                        {cfg.logo_url
                            ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 max-w-full object-contain" />
                            : <div className="flex flex-col items-start leading-none">
                                <span className="text-xl font-black tracking-tighter text-white italic">{cfg.logo_text || "MARCA"}</span>
                                <div className="flex gap-[3px] mt-[2px]">
                                    {cfg.logo_colors.map((c, i) => <div key={i} className="h-[3px] w-[10px] rounded-sm" style={{ backgroundColor: c }} />)}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="cursor-pointer block">
                            <div className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/60 text-white/50 hover:text-[#00CFFF] transition-all text-xs font-semibold w-fit">
                                {uploading === "logo" ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                {uploading === "logo" ? "Subiendo..." : "Subir logo (PNG/SVG/WebP)"}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoImage(e.target.files[0])} />
                        </label>
                        {cfg.logo_url && (
                            <button onClick={() => setCfg(prev => ({ ...prev, logo_url: "" }))} className="text-xs text-red-400/60 hover:text-red-400">
                                ✕ Quitar imagen (volver a logo de texto)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Logo Mobile ── */}
            <div className="portal-card space-y-4">
                <h3 className="text-sm font-semibold text-white/70">Logo — Mobile / Responsive</h3>
                <p className="text-xs text-white/40">Logo alternativo para pantallas pequeñas. Si no subís uno, se usa el logo desktop. Recomendado: ícono cuadrado PNG.</p>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-[#2a2a2a] bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cfg.logo_mobile_url
                            ? <img src={cfg.logo_mobile_url} alt="Logo mobile" className="max-h-12 max-w-full object-contain" />
                            : <span className="text-white/20 text-[10px] text-center">Sin logo mobile</span>
                        }
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="cursor-pointer block">
                            <div className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-[#3a3a3a] hover:border-[#E91E8C]/60 text-white/50 hover:text-[#E91E8C] transition-all text-xs font-semibold w-fit">
                                {uploading === "logo_mobile" ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                {uploading === "logo_mobile" ? "Subiendo..." : "Subir logo mobile (PNG/SVG)"}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleMobileLogo(e.target.files[0])} />
                        </label>
                        {cfg.logo_mobile_url && (
                            <button onClick={() => setCfg(prev => ({ ...prev, logo_mobile_url: "" }))} className="text-xs text-red-400/60 hover:text-red-400">
                                ✕ Quitar logo mobile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Favicon ── */}
            <div className="portal-card space-y-4">
                <h3 className="text-sm font-semibold text-white/70">Favicon — Ícono del Sitio</h3>
                <p className="text-xs text-white/40">El ícono en la pestaña del navegador. Recomendado: ICO o PNG cuadrado 32×32 o 64×64 px.</p>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={`/favicon.ico?v=${Date.now()}`} alt="Favicon" className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="cursor-pointer block">
                            <div className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-[#3a3a3a] hover:border-[#FFE000]/60 text-white/50 hover:text-[#FFE000] transition-all text-xs font-semibold w-fit">
                                {uploading === "favicon" ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                {uploading === "favicon" ? "Subiendo..." : "Subir favicon (ICO / PNG)"}
                            </div>
                            <input type="file" accept="image/x-icon,image/png,.ico" className="hidden" onChange={e => e.target.files?.[0] && handleFavicon(e.target.files[0])} />
                        </label>
                        <p className="text-[10px] text-white/25">Al subir se reemplaza el favicon.ico del sitio. Recargá la página para verlo.</p>
                    </div>
                </div>
            </div>

            {/* ── Logo de texto + colores CMYK ── */}
            <div className="portal-card space-y-5">
                <h3 className="text-sm font-semibold text-white/70">Logo de Texto (alternativo si no hay imagen)</h3>

                {/* Live preview */}
                <div className="bg-black rounded-xl p-6 flex items-center justify-center border border-[#2a2a2a]">
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-4xl font-black tracking-tighter text-white italic">{cfg.logo_text || "MARCA"}</span>
                        <div className="flex gap-[4px] mt-[3px]">
                            {cfg.logo_colors.map((c, i) => (
                                <div key={i} className="h-[5px] w-[16px] rounded-sm" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">TEXTO DEL LOGO</label>
                    <input value={cfg.logo_text} onChange={e => setCfg({ ...cfg, logo_text: e.target.value })} className="dark-input text-lg font-black italic" placeholder="user" />
                </div>

                <div>
                    <label className="text-xs text-white/40 mb-3 block font-semibold tracking-wider">COLORES DE LA BARRA (CMYK)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {cfg.logo_colors.map((color, i) => (
                            <label key={i} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] cursor-pointer">
                                <input
                                    type="color" value={color}
                                    onChange={e => {
                                        const colors = [...cfg.logo_colors];
                                        colors[i] = e.target.value;
                                        setCfg({ ...cfg, logo_colors: colors });
                                    }}
                                    className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                                />
                                <div>
                                    <p className="text-xs font-semibold text-white">{COLOR_LABELS[i]}</p>
                                    <p className="text-[10px] text-white/30 font-mono">{color}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar Logo"}
                </button>
            </div>
        </div>
    );
}

// ── Menu Editor ───────────────────────────────────────────────
function MenuAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<SiteConfig>(mockSiteConfig);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadConfigFromApi().then(setCfg); }, []);

    const updateItem = (i: number, field: "label" | "href", val: string) => {
        const nav = [...cfg.nav_items];
        nav[i] = { ...nav[i], [field]: val };
        setCfg({ ...cfg, nav_items: nav });
    };
    const addItem = () => setCfg({ ...cfg, nav_items: [...cfg.nav_items, { label: "Nuevo item", href: "/" }] });
    const removeItem = (i: number) => setCfg({ ...cfg, nav_items: cfg.nav_items.filter((_, j) => j !== i) });

    const addChild = (i: number) => {
        const nav = [...cfg.nav_items];
        nav[i] = { ...nav[i], children: [...(nav[i].children ?? []), { label: "Sub-item", href: "/" }] };
        setCfg({ ...cfg, nav_items: nav });
    };
    const updateChild = (i: number, ci: number, field: "label" | "href", val: string) => {
        const nav = [...cfg.nav_items];
        const children = [...(nav[i].children ?? [])];
        children[ci] = { ...children[ci], [field]: val };
        nav[i] = { ...nav[i], children };
        setCfg({ ...cfg, nav_items: nav });
    };
    const removeChild = (i: number, ci: number) => {
        const nav = [...cfg.nav_items];
        nav[i] = { ...nav[i], children: (nav[i].children ?? []).filter((_, j) => j !== ci) };
        setCfg({ ...cfg, nav_items: nav });
    };

    const handleSave = async () => {
        setSaving(true);
        try { await saveConfigToApi(cfg); onSave("Menu guardado ✓"); }
        catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className="max-w-2xl">
            <div className="portal-card space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">Items del Menu de Navegacion</h3>
                    <button onClick={addItem} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                        <Plus size={14} /> Agregar item
                    </button>
                </div>

                <div className="space-y-3">
                    {cfg.nav_items.map((item, i) => (
                        <div key={i} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
                            <div className="flex items-center gap-2 p-3">
                                <GripVertical size={14} className="text-white/20 flex-shrink-0" />
                                <input value={item.label} onChange={e => updateItem(i, "label", e.target.value)} className="dark-input py-1.5 text-xs font-semibold flex-1" placeholder="Etiqueta" />
                                <input value={item.href} onChange={e => updateItem(i, "href", e.target.value)} className="dark-input py-1.5 text-xs flex-1 font-mono" placeholder="URL" />
                                <button
                                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all flex-shrink-0 ${(item.children?.length ?? 0) > 0 ? "text-[#E91E8C] bg-[#E91E8C]/10" : "text-white/30 hover:text-white/60"}`}
                                >
                                    <ChevronDown size={12} />
                                    {(item.children?.length ?? 0) > 0 ? `${item.children!.length} sub` : "sub"}
                                </button>
                                <button onClick={() => removeItem(i)} className="text-white/20 hover:text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
                            </div>

                            {expandedIdx === i && (
                                <div className="border-t border-[#2a2a2a] bg-[#111] px-4 pb-3 pt-2 space-y-2">
                                    <p className="text-[10px] text-white/30 font-semibold tracking-wider mb-1">SUB-MENU DE &quot;{item.label}&quot;</p>
                                    {(item.children ?? []).map((child, ci) => (
                                        <div key={ci} className="flex items-center gap-2 pl-4">
                                            <span className="text-white/20 text-xs">&#x2514;</span>
                                            <input value={child.label} onChange={e => updateChild(i, ci, "label", e.target.value)} className="dark-input py-1 text-xs flex-1" placeholder="Etiqueta" />
                                            <input value={child.href} onChange={e => updateChild(i, ci, "href", e.target.value)} className="dark-input py-1 text-xs flex-1 font-mono" placeholder="URL" />
                                            <button onClick={() => removeChild(i, ci)} className="text-white/20 hover:text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addChild(i)} className="ml-4 flex items-center gap-1.5 text-[11px] text-[#00CFFF]/70 hover:text-[#00CFFF]">
                                        <Plus size={11} /> Agregar sub-item
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar Menu"}
                </button>
            </div>
        </div>
    );
}

// ── Paginas CRUD ──────────────────────────────────────────────
function PagesAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [pages, setPages] = useState<Page[]>([]);
    const [editing, setEditing] = useState<Page | null>(null);

    useEffect(() => { loadPagesFromApi().then(setPages); }, []);

    const blankPage = (): Page => ({
        id: Date.now().toString(), title: "Nueva Pagina", slug: "nueva-pagina",
        content: "# Nueva Pagina\n\nEscribi el contenido aqui...",
        active: true, show_in_menu: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    const saveEditing = async () => {
        if (!editing) return;
        const updated = { ...editing, updated_at: new Date().toISOString() };
        const exists = pages.some(p => p.id === updated.id);
        const newList = exists ? pages.map(p => p.id === updated.id ? updated : p) : [...pages, updated];
        setPages(newList);
        try { await savePagesToApi(newList); onSave("Pagina guardada ✓"); }
        catch (e) { onSave("Error: " + String(e)); }
        setEditing(null);
    };

    const removePage = async (id: string) => {
        const newList = pages.filter(p => p.id !== id);
        setPages(newList);
        try { await savePagesToApi(newList); }
        catch { /* silent */ }
    };

    // ── Editor de página ──
    if (editing) {
        return (
            <div className="max-w-3xl space-y-4">
                <button onClick={() => setEditing(null)} className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 mb-2">
                    &#x2190; Volver a paginas
                </button>
                <div className="portal-card space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">TITULO</label>
                            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="dark-input" placeholder="Titulo de la pagina" />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">SLUG (URL)</label>
                            <input
                                value={editing.slug}
                                onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                                className="dark-input font-mono"
                                placeholder="mi-pagina"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="accent-[#00CFFF]" />
                            <span className="text-xs text-white/60">Pagina activa</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editing.show_in_menu} onChange={e => setEditing({ ...editing, show_in_menu: e.target.checked })} className="accent-[#E91E8C]" />
                            <span className="text-xs text-white/60">Mostrar en menu</span>
                        </label>
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">CONTENIDO (Markdown soportado)</label>
                        <textarea
                            value={editing.content}
                            onChange={e => setEditing({ ...editing, content: e.target.value })}
                            rows={16}
                            className="dark-input resize-y font-mono text-xs leading-relaxed"
                            placeholder="# Titulo&#10;&#10;Contenido..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={saveEditing} className="flex-1 py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors">Guardar Pagina</button>
                        <button onClick={() => setEditing(null)} className="px-6 py-3 rounded-lg border border-[#2a2a2a] text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors">Cancelar</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Lista de páginas ──
    return (
        <div className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">Gestion de Paginas</h3>
                <button onClick={() => setEditing(blankPage())} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                    <Plus size={14} /> Nueva Pagina
                </button>
            </div>
            <div className="portal-card !p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#2a2a2a]">
                            {["Titulo", "Slug", "En menu", "Estado", ""].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs text-white/30 font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                        {pages.map(page => (
                            <tr key={page.id} className="hover:bg-white/[0.02] group">
                                <td className="px-4 py-3 text-sm text-white font-medium">{page.title}</td>
                                <td className="px-4 py-3 text-xs text-white/40 font-mono">/{page.slug}</td>
                                <td className="px-4 py-3">
                                    {page.show_in_menu
                                        ? <span className="text-[10px] font-bold text-[#E91E8C] bg-[#E91E8C]/10 px-2 py-0.5 rounded-full">SI</span>
                                        : <span className="text-[10px] text-white/20">--</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {page.active
                                        ? <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">ACTIVA</span>
                                        : <span className="text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">INACTIVA</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditing(page)} className="text-white/40 hover:text-[#00CFFF]"><Edit3 size={14} /></button>
                                        <button onClick={() => removePage(page.id)} className="text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pages.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-white/20">No hay paginas aun.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Config Portada / Hero ─────────────────────────────────────
function SiteConfigAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<SiteConfig>(mockSiteConfig);
    const [mediaError, setMediaError] = useState("");
    const [saving, setSaving] = useState(false);
    const videoRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadConfigFromApi().then(setCfg); }, []);

    // Resize image before storing to stay within quota
    const resizeImage = (file: File, maxPx = 1280): Promise<string> =>
        new Promise((resolve) => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.src = url;
        });

    const handleMedia = async (file: File) => {
        setMediaError("");
        if (file.type.startsWith("video/")) {
            setMediaError("Subiendo video...");
            try {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("type", "media");
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                if (!res.ok) throw new Error("Error al subir el video");
                const { url } = await res.json();
                setCfg(prev => ({ ...prev, hero_video_url: url }));
                setMediaError("");
            } catch (e) {
                setMediaError("Error al subir video: " + String(e));
            }
            return;
        }
        const b64 = await resizeImage(file);
        setCfg(prev => ({ ...prev, hero_video_url: b64 }));
    };

    const handleSave = async () => {
        setMediaError("");
        setSaving(true);
        try { await saveConfigToApi(cfg); onSave("Portada guardada ✓"); }
        catch (e) { setMediaError("Error al guardar: " + String(e)); }
        finally { setSaving(false); }
    };

    const subtitles = cfg.hero_subtitles ?? [cfg.hero_subtitle ?? ""];
    const updateSub = (i: number, val: string) => {
        const next = [...subtitles]; next[i] = val;
        setCfg({ ...cfg, hero_subtitles: next });
    };
    const addSub = () => setCfg({ ...cfg, hero_subtitles: [...subtitles, "Nuevo subtítulo"] });
    const removeSub = (i: number) => setCfg({ ...cfg, hero_subtitles: subtitles.filter((_, j) => j !== i) });

    return (
        <div className="max-w-2xl space-y-6">
            {mediaError && (
                <div className={mediaError.startsWith("Subiendo") ? "bg-[#00CFFF]/10 border border-[#00CFFF]/30 text-[#00CFFF] text-xs rounded-xl px-4 py-3 font-semibold" : "bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-3 font-semibold"}>
                    {mediaError.startsWith("Subiendo") ? "⏳" : "⚠️"} {mediaError}
                </div>
            )}

            <div className="portal-card space-y-4">
                <h3 className="text-sm font-semibold text-white/70">Portada — Fondo (Video o Imagen)</h3>

                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#2a2a2a] flex items-center justify-center" style={{ background: "#111" }}>
                    {cfg.hero_video_url.startsWith("data:video") ? (
                        <video src={cfg.hero_video_url} autoPlay muted loop className="w-full h-full object-cover opacity-50" />
                    ) : cfg.hero_video_url.startsWith("data:image") ? (
                        <img src={cfg.hero_video_url} alt="" className="w-full h-full object-cover opacity-50" />
                    ) : cfg.hero_video_url ? (
                        <video src={cfg.hero_video_url} autoPlay muted loop className="w-full h-full object-cover opacity-50" />
                    ) : (
                        <div className="text-white/20 flex flex-col items-center gap-2"><Video size={32} /><span className="text-xs">Sin media aun</span></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 text-white font-black text-lg pointer-events-none">{cfg.hero_title.split("\n")[0]}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/50 text-white/40 hover:text-[#00CFFF] transition-all text-xs font-semibold">
                            <Video size={16} /> Subir Video desde PC
                        </div>
                        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleMedia(e.target.files[0])} />
                    </label>
                    <label className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#3a3a3a] hover:border-[#E91E8C]/50 text-white/40 hover:text-[#E91E8C] transition-all text-xs font-semibold">
                            <ImageIcon size={16} /> Subir Imagen de fondo
                        </div>
                        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleMedia(e.target.files[0])} />
                    </label>
                </div>

                <div>
                    <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">O PEGAR URL DEL VIDEO (YouTube, CDN, etc.)</label>
                    <input
                        value={cfg.hero_video_url.startsWith("data:") ? "" : cfg.hero_video_url}
                        onChange={e => { setMediaError(""); setCfg({ ...cfg, hero_video_url: e.target.value }); }}
                        className="dark-input" placeholder="https://... o /video/hero.mp4"
                    />
                </div>
            </div>

            <div className="portal-card space-y-4">
                <h3 className="text-sm font-semibold text-white/70">Textos de la Portada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">TITULO PRINCIPAL (una línea por renglón)</label>
                        <textarea rows={3} value={cfg.hero_title} onChange={e => setCfg({ ...cfg, hero_title: e.target.value })} className="dark-input resize-none" />
                    </div>

                    {/* Subtítulos rotativos */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-white/40 font-semibold tracking-wider">
                                SUBTÍTULOS ROTATIVOS
                                <span className="ml-2 text-[#00CFFF]/60 font-normal normal-case">el cabezal los muestra uno por uno</span>
                            </label>
                            <button onClick={addSub} className="flex items-center gap-1 text-[11px] text-[#00CFFF]/70 hover:text-[#00CFFF]">
                                <Plus size={11} /> Agregar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {subtitles.map((sub, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs text-white/20 w-5 text-right flex-shrink-0">{i + 1}.</span>
                                    <input value={sub} onChange={e => updateSub(i, e.target.value)} className="dark-input py-1.5 text-sm flex-1" placeholder="Subtítulo..." />
                                    <button onClick={() => removeSub(i)} className="text-white/20 hover:text-red-400 flex-shrink-0"><Trash2 size={13} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">BOTON 1 TEXTO</label>
                        <input value={cfg.hero_button1_text} onChange={e => setCfg({ ...cfg, hero_button1_text: e.target.value })} className="dark-input" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">BOTON 1 URL</label>
                        <input value={cfg.hero_button1_url} onChange={e => setCfg({ ...cfg, hero_button1_url: e.target.value })} className="dark-input" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">BOTON 2 TEXTO</label>
                        <input value={cfg.hero_button2_text} onChange={e => setCfg({ ...cfg, hero_button2_text: e.target.value })} className="dark-input" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 mb-1 block font-semibold tracking-wider">BOTON 2 URL</label>
                        <input value={cfg.hero_button2_url} onChange={e => setCfg({ ...cfg, hero_button2_url: e.target.value })} className="dark-input" />
                    </div>
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Portada"}
            </button>
        </div>
    );
}

// ── Clientes Admin ────────────────────────────────────────────
const DEPARTAMENTOS_LIST = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
    "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
    "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
    "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

function ClientsAdmin() {
    const [clients, setClients] = useState<ApiClient[]>([]);
    const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
    const [editing, setEditing] = useState<Partial<ApiClient> | null>(null);
    const [saving, setSaving] = useState(false);

    const blankClient = (): Partial<ApiClient> => ({
        name: "", apellido: "", email: "", phone: "", company: "", razon_social: "",
        cedula: "", direccion: "", departamento: "", localidad: "", asesor: "",
        acepta_ofertas: true, status: "approved",
    });

    const reload = () => apiGet<ApiClient[]>("/api/clients").then(setClients).catch(() => { });
    useEffect(() => { reload(); }, []);

    const saveClient = async () => {
        if (!editing?.name?.trim()) return;
        setSaving(true);
        try {
            if (editing.id) {
                await apiPut(`/api/clients/${editing.id}`, editing);
            } else {
                await apiPost("/api/clients", editing);
            }
            setEditing(null);
            reload();
        } catch (e) { alert("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    const approveClient = async (c: ApiClient) => {
        await apiPut(`/api/clients/${c.id}`, { status: "approved" });
        reload();
    };

    const rejectClient = async (c: ApiClient) => {
        if (!confirm(`¿Rechazar y eliminar a ${c.name}?`)) return;
        await apiDelete(`/api/clients/${c.id}`);
        setClients(prev => prev.filter(x => x.id !== c.id));
    };

    const deleteClient = async (id: number) => {
        if (!confirm("¿Eliminar cliente?")) return;
        await apiDelete(`/api/clients/${id}`);
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const setE = (k: keyof ApiClient, v: string | boolean) =>
        setEditing(p => ({ ...p, [k]: v }));

    const filtered = clients.filter(c =>
        filter === "all" ? true : (c.status ?? "approved") === filter
    );
    const pendingCount = clients.filter(c => c.status === "pending").length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white/70">Gestión de Clientes</h3>
                    {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                            {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {(["all", "pending", "approved"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === f ? "bg-[#00CFFF]/20 text-[#00CFFF]" : "text-white/30 hover:text-white/60"}`}>
                            {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : "Aprobados"}
                        </button>
                    ))}
                    <button onClick={() => setEditing(blankClient())} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                        <Plus size={14} /> Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Edit / New modal */}
            {editing !== null && (
                <div className="portal-card space-y-3">
                    <p className="text-xs text-white/40 font-semibold tracking-wider">{editing.id ? "EDITAR CLIENTE" : "NUEVO CLIENTE"}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">NOMBRE *</label>
                            <input value={editing.name ?? ""} onChange={e => setE("name", e.target.value)} className="dark-input" placeholder="Nombre" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">APELLIDO</label>
                            <input value={editing.apellido ?? ""} onChange={e => setE("apellido", e.target.value)} className="dark-input" placeholder="Apellido" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">EMAIL</label>
                            <input type="email" value={editing.email ?? ""} onChange={e => setE("email", e.target.value)} className="dark-input text-xs" placeholder="email@ejemplo.com" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">TELÉFONO</label>
                            <input value={editing.phone ?? ""} onChange={e => setE("phone", e.target.value)} className="dark-input text-xs" placeholder="+598 99 000 000" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] text-white/30 mb-1 block">RAZÓN SOCIAL / EMPRESA</label>
                            <input value={editing.razon_social ?? editing.company ?? ""} onChange={e => setE("razon_social", e.target.value)} className="dark-input text-xs" placeholder="Nombre de empresa (opcional)" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">CÉDULA / RUT</label>
                            <input value={editing.cedula ?? ""} onChange={e => setE("cedula", e.target.value)} className="dark-input text-xs" placeholder="1.234.567-8" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">DIRECCIÓN</label>
                            <input value={editing.direccion ?? ""} onChange={e => setE("direccion", e.target.value)} className="dark-input text-xs" placeholder="Calle 1234" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">DEPARTAMENTO</label>
                            <select value={editing.departamento ?? ""} onChange={e => setE("departamento", e.target.value)} className="dark-input text-xs">
                                <option value="">Seleccionar...</option>
                                {DEPARTAMENTOS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">LOCALIDAD</label>
                            <input value={editing.localidad ?? ""} onChange={e => setE("localidad", e.target.value)} className="dark-input text-xs" placeholder="Ciudad / Barrio" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">ASESOR</label>
                            <input value={editing.asesor ?? ""} onChange={e => setE("asesor", e.target.value)} className="dark-input text-xs" placeholder="Nombre asesor" />
                        </div>
                        <div>
                            <label className="text-[10px] text-white/30 mb-1 block">ESTADO</label>
                            <select value={editing.status ?? "approved"} onChange={e => setE("status", e.target.value)} className="dark-input text-xs">
                                <option value="approved">Aprobado</option>
                                <option value="pending">Pendiente</option>
                            </select>
                        </div>
                        {editing.pin_code && (
                            <div>
                                <label className="text-[10px] text-white/30 mb-1 block">PIN PORTAL</label>
                                <input value={editing.pin_code ?? ""} onChange={e => setE("pin_code", e.target.value)} className="dark-input text-xs font-mono" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={saveClient} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#00CFFF] text-black text-sm font-bold disabled:opacity-50">
                            {saving ? "Guardando..." : "Guardar Cliente"}
                        </button>
                        <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-lg border border-[#2a2a2a] text-white/50 text-sm hover:text-white">Cancelar</button>
                    </div>
                </div>
            )}

            {/* Pending registrations highlighted */}
            {filter !== "approved" && filtered.filter(c => c.status === "pending").length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-yellow-400/60 font-semibold tracking-wider">PENDIENTES DE APROBACIÓN</p>
                    {filtered.filter(c => c.status === "pending").map(c => (
                        <div key={c.id} className="portal-card border border-yellow-500/20 bg-yellow-500/5 flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-white">{c.name} {c.apellido}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 font-bold">PENDIENTE</span>
                                </div>
                                <p className="text-xs text-white/40 mt-0.5">{c.email ?? "—"} · {c.phone ?? "—"}</p>
                                {c.razon_social && <p className="text-xs text-white/30">{c.razon_social}</p>}
                                {c.cedula && <p className="text-[10px] text-white/25">Cédula: {c.cedula}</p>}
                                {c.departamento && <p className="text-[10px] text-white/25">{c.departamento}{c.localidad ? ` · ${c.localidad}` : ""}</p>}
                                {c.asesor && <p className="text-[10px] text-white/25">Asesor: {c.asesor}</p>}
                                <p className="text-[10px] text-white/20 mt-1">Registrado: {c.created_at ? new Date(c.created_at).toLocaleString("es-UY") : "—"}</p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button onClick={() => approveClient(c)} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-colors">
                                    ✓ Aprobar
                                </button>
                                <button onClick={() => setEditing(c)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs hover:text-white hover:bg-white/10 transition-colors">
                                    Editar
                                </button>
                                <button onClick={() => rejectClient(c)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                                    ✕ Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* All/Approved table */}
            <div className="portal-card !p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#2a2a2a]">
                            {["Nombre", "Email", "Teléfono", "Empresa / RUT", "Código", "Estado", ""].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs text-white/30 font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                        {filtered.filter(c => filter === "all" ? c.status !== "pending" : c.status === filter).map(c => (
                            <tr key={c.id} className="hover:bg-white/[0.02] group">
                                <td className="px-4 py-3 text-sm text-white font-medium">{c.name} {c.apellido}</td>
                                <td className="px-4 py-3 text-xs text-white/50">{c.email ?? "—"}</td>
                                <td className="px-4 py-3 text-xs text-white/50">{c.phone ?? "—"}</td>
                                <td className="px-4 py-3 text-xs text-white/50">{c.razon_social || c.company || "—"}</td>
                                <td className="px-4 py-3 text-xs font-mono text-white/30">{c.client_code ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(c.status ?? "approved") === "approved" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                                        {(c.status ?? "approved") === "approved" ? "Aprobado" : "Pendiente"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditing(c)} className="text-white/40 hover:text-[#00CFFF]"><Edit3 size={14} /></button>
                                        <button onClick={() => deleteClient(c.id)} className="text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.filter(c => filter === "all" ? c.status !== "pending" : c.status === filter).length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-white/20">No hay clientes en esta vista.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Payment Gateways Admin ────────────────────────────────────
type GatewayType = "mercadopago" | "bank_transfer" | "cash" | "custom";
interface PaymentGateway {
    id: number;
    name: string;
    type: GatewayType;
    description: string;
    config: Record<string, string>;
    active: boolean;
    test_mode: boolean;
    sort_order: number;
}
const GATEWAY_TYPES: { value: GatewayType; label: string }[] = [
    { value: "mercadopago", label: "MercadoPago" },
    { value: "bank_transfer", label: "Transferencia Bancaria" },
    { value: "cash", label: "Efectivo" },
    { value: "custom", label: "Personalizado" },
];
const emptyGateway = (): Omit<PaymentGateway, "id"> => ({
    name: "", type: "mercadopago", description: "",
    config: {}, active: false, test_mode: true, sort_order: 0,
});

function PaymentGatewaysAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<(Omit<PaymentGateway, "id"> & { id?: number }) | null>(null);
    const [saving, setSaving] = useState(false);
    const [configJson, setConfigJson] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const data = await apiGet<PaymentGateway[]>("/api/payment-gateways");
        setGateways(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const openNew = () => {
        const g = emptyGateway();
        setEditing(g);
        setConfigJson("{}");
    };

    const openEdit = (g: PaymentGateway) => {
        setEditing({ ...g });
        setConfigJson(JSON.stringify(g.config || {}, null, 2));
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        let parsedConfig: Record<string, string> = {};
        try { parsedConfig = JSON.parse(configJson); } catch { parsedConfig = {}; }
        const payload = { ...editing, config: parsedConfig };
        const url = editing.id ? `/api/payment-gateways/${editing.id}` : "/api/payment-gateways";
        const method = editing.id ? "PUT" : "POST";
        await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        setSaving(false);
        setEditing(null);
        await load();
        onSave(editing.id ? "Pasarela actualizada" : "Pasarela creada");
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar esta pasarela?")) return;
        await fetch(`/api/payment-gateways/${id}`, { method: "DELETE" });
        await load();
        onSave("Pasarela eliminada");
    };

    const handleToggleActive = async (g: PaymentGateway) => {
        await fetch(`/api/payment-gateways/${g.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...g, active: !g.active }),
        });
        await load();
        onSave(g.active ? "Pasarela desactivada" : "Pasarela activada");
    };

    const gatewayIcon = (type: GatewayType) => {
        if (type === "mercadopago") return <CreditCard className="w-5 h-5 text-sky-500" />;
        if (type === "bank_transfer") return <Building2 className="w-5 h-5 text-emerald-500" />;
        if (type === "cash") return <Banknote className="w-5 h-5 text-amber-500" />;
        return <CreditCard className="w-5 h-5 text-gray-400" />;
    };

    const renderConfigFields = () => {
        if (!editing) return null;
        const t = editing.type;
        const cfg = editing.config || {};
        const setField = (k: string, v: string) => setEditing(e => e ? { ...e, config: { ...e.config, [k]: v } } : e);

        if (t === "mercadopago") return (
            <div className="space-y-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={cfg.public_key || ""} onChange={e => setField("public_key", e.target.value)} placeholder="APP_USR-..." /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" type="password" value={cfg.access_token || ""} onChange={e => setField("access_token", e.target.value)} placeholder="APP_USR-..." /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={cfg.webhook_secret || ""} onChange={e => setField("webhook_secret", e.target.value)} /></div>
            </div>
        );
        if (t === "bank_transfer") return (
            <div className="space-y-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={cfg.bank_name || ""} onChange={e => setField("bank_name", e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Titular de la cuenta</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={cfg.account_holder || ""} onChange={e => setField("account_holder", e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Número de cuenta / CBU / Alias</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm font-mono" value={cfg.account_number || ""} onChange={e => setField("account_number", e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                    <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={cfg.instructions || ""} onChange={e => setField("instructions", e.target.value)} /></div>
            </div>
        );
        if (t === "cash") return (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} value={cfg.instructions || ""} onChange={e => setField("instructions", e.target.value)} /></div>
        );
        return (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Configuración JSON</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={6} value={configJson} onChange={e => setConfigJson(e.target.value)} /></div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando pasarelas…</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Pasarelas de Pago</h2>
                    <p className="text-sm text-gray-500 mt-1">Configurá y activá los métodos de pago disponibles en el checkout</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                    <span className="text-lg leading-none">+</span> Nueva pasarela
                </button>
            </div>

            {gateways.length === 0 && (
                <div className="text-center py-12 text-gray-400">No hay pasarelas configuradas</div>
            )}

            <div className="space-y-3">
                {gateways.map(g => (
                    <div key={g.id} className={`border rounded-xl p-4 flex items-center gap-4 ${g.active ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-70"}`}>
                        <div className="flex-shrink-0">{gatewayIcon(g.type)}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{g.name}</span>
                                {g.test_mode && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Sandbox</span>}
                                {g.active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activa</span>}
                            </div>
                            {g.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{g.description}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{GATEWAY_TYPES.find(t => t.value === g.type)?.label}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleToggleActive(g)} title={g.active ? "Desactivar" : "Activar"}
                                className={`p-1.5 rounded-lg transition-colors ${g.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                                {g.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                            </button>
                            <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal form */}
            {editing !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-bold">{editing.id ? "Editar pasarela" : "Nueva pasarela"}</h3>
                            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={editing.name} onChange={e => setEditing(ed => ed ? { ...ed, name: e.target.value } : ed)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={editing.type}
                                    onChange={e => setEditing(ed => ed ? { ...ed, type: e.target.value as GatewayType, config: {} } : ed)}>
                                    {GATEWAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={editing.description} onChange={e => setEditing(ed => ed ? { ...ed, description: e.target.value } : ed)} /></div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm font-medium text-gray-700">Modo Sandbox / Test</span>
                                <button type="button" onClick={() => setEditing(ed => ed ? { ...ed, test_mode: !ed.test_mode } : ed)}
                                    className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border transition-colors ${editing.test_mode ? "bg-yellow-50 border-yellow-300 text-yellow-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                                    {editing.test_mode ? <><ToggleRight className="w-4 h-4" /> Activado</> : <><ToggleLeft className="w-4 h-4" /> Desactivado</>}
                                </button>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                                <input type="number" className="w-24 border rounded-lg px-3 py-2 text-sm" value={editing.sort_order}
                                    onChange={e => setEditing(ed => ed ? { ...ed, sort_order: Number(e.target.value) } : ed)} /></div>
                            <div className="border-t pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Configuración</p>
                                {renderConfigFields()}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Cancelar</button>
                            <button type="button" onClick={handleSave} disabled={saving || !editing.name}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {saving ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Home Sections Admin ───────────────────────────────────────
const SECTION_TYPES = [
    { value: "hero", label: "Hero / Portada", desc: "Banner principal con título y botones" },
    { value: "services_slider", label: "Slider de Servicios", desc: "Galería de servicios activos" },
    { value: "process", label: "Proceso de Trabajo", desc: "Pasos del proceso de trabajo" },
    { value: "cta_banner", label: "Banner CTA", desc: "Llamada a la acción personalizada" },
    { value: "text_block", label: "Bloque de Texto", desc: "Sección con título y contenido libre" },
    { value: "stats", label: "Estadísticas", desc: "Números y métricas destacadas" },
];
interface HomeSection {
    id: number; type: string; title: string; subtitle: string;
    content: Record<string, unknown>; active: boolean; sort_order: number;
}
const emptySec = (): Omit<HomeSection, "id"> => ({
    type: "text_block", title: "", subtitle: "", content: {}, active: true, sort_order: 0,
});

function HomeSectionsAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<(Omit<HomeSection, "id"> & { id?: number }) | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await apiGet<HomeSection[]>("/api/home-sections");
        setSections(data || []);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    // When type changes to "process", auto-load current steps from /api/process
    useEffect(() => {
        if (editing?.type === "process" && !Array.isArray(editing.content?.steps)) {
            apiGet<unknown[]>("/api/process").then(rows => {
                const steps: ProcessStep[] = rows.map(r => {
                    const s = r as Record<string, unknown>;
                    return {
                        icon: String(s.icon ?? "?"),
                        label: String(s.label ?? "PASO"),
                        description: String(s.description ?? ""),
                        active: Boolean(s.active ?? true),
                        icon_url: s.icon_url ? String(s.icon_url) : undefined,
                        icon_color: s.icon_color ? String(s.icon_color) : undefined,
                    };
                });
                setEditing(ed => ed ? { ...ed, content: { ...ed.content, steps: steps.length ? steps : defaultProcessConfig.steps } } : ed);
            }).catch(() => {
                setEditing(ed => ed ? { ...ed, content: { ...ed.content, steps: defaultProcessConfig.steps } } : ed);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing?.type]);

    const updateModalStep = (i: number, field: string, val: unknown) => {
        setEditing(ed => {
            if (!ed) return ed;
            const steps = [...((ed.content?.steps as ProcessStep[]) ?? [])];
            steps[i] = { ...steps[i], [field]: val };
            return { ...ed, content: { ...ed.content, steps } };
        });
    };

    const addModalStep = () => {
        setEditing(ed => {
            if (!ed) return ed;
            const steps = [...((ed.content?.steps as ProcessStep[]) ?? [])];
            steps.push({ icon: "?", label: "NUEVO", description: "", active: true });
            return { ...ed, content: { ...ed.content, steps } };
        });
    };

    const removeModalStep = (i: number) => {
        setEditing(ed => {
            if (!ed) return ed;
            const steps = ((ed.content?.steps as ProcessStep[]) ?? []).filter((_, j) => j !== i);
            return { ...ed, content: { ...ed.content, steps } };
        });
    };

    const handleModalStepIcon = async (i: number, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "media");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const { url } = await res.json();
            updateModalStep(i, "icon_url", url);
        } catch { /* ignore */ }
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        // If process type, also persist steps to /api/process for ProcessSection backward-compat
        if (editing.type === "process" && Array.isArray(editing.content?.steps)) {
            const steps = (editing.content.steps as ProcessStep[]).map((s, idx) => ({ ...s, sort_order: idx + 1 }));
            await apiPut("/api/process", steps).catch(() => { });
        }
        const url = editing.id ? `/api/home-sections/${editing.id}` : "/api/home-sections";
        const method = editing.id ? "PUT" : "POST";
        await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
        setSaving(false);
        setEditing(null);
        await load();
        onSave(editing.id ? "Sección actualizada" : "Sección creada");
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar esta sección?")) return;
        await fetch(`/api/home-sections/${id}`, { method: "DELETE" });
        await load();
        onSave("Sección eliminada");
    };

    const toggleActive = async (s: HomeSection) => {
        await fetch(`/api/home-sections/${s.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...s, active: !s.active }),
        });
        await load();
    };

    const moveOrder = async (s: HomeSection, dir: -1 | 1) => {
        await fetch(`/api/home-sections/${s.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...s, sort_order: s.sort_order + dir }),
        });
        await load();
    };

    if (loading) return <div className="p-8 text-center text-white/30">Cargando secciones…</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-white/70">Secciones del Home</h3>
                    <p className="text-xs text-white/30 mt-0.5">Agregá, editá y reordenás las secciones que se muestran en la página principal</p>
                </div>
                <button onClick={() => setEditing(emptySec())}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20">
                    <Plus size={14} /> Nueva sección
                </button>
            </div>

            {sections.length === 0 && <p className="text-xs text-white/20 text-center py-8">Sin secciones configuradas</p>}

            <div className="space-y-2">
                {sections.sort((a, b) => a.sort_order - b.sort_order).map(s => {
                    const typeInfo = SECTION_TYPES.find(t => t.value === s.type);
                    return (
                        <div key={s.id} className={`portal-card !p-3 flex items-center gap-3 ${!s.active ? "opacity-50" : ""}`}>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => moveOrder(s, -1)} className="text-white/20 hover:text-white/60 leading-none">▲</button>
                                <button onClick={() => moveOrder(s, 1)} className="text-white/20 hover:text-white/60 leading-none">▼</button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">{s.title || <span className="text-white/30 italic">Sin título</span>}</span>
                                    <span className="text-[10px] bg-[#00CFFF]/10 text-[#00CFFF] px-2 py-0.5 rounded-full">{typeInfo?.label ?? s.type}</span>
                                    {!s.active && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Oculta</span>}
                                </div>
                                {s.subtitle && <p className="text-xs text-white/30 mt-0.5 truncate">{s.subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => toggleActive(s)} title={s.active ? "Ocultar" : "Mostrar"}
                                    className={`p-1.5 rounded-lg ${s.active ? "text-green-400 hover:bg-green-400/10" : "text-white/20 hover:bg-white/10"}`}>
                                    {s.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </button>
                                <button onClick={() => setEditing({ ...s })} className="p-1.5 rounded-lg text-[#00CFFF] hover:bg-[#00CFFF]/10">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {editing !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        {/* Header — fijo */}
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a] flex-shrink-0">
                            <h3 className="font-bold text-white">{editing.id ? "Editar sección" : "Nueva sección"}</h3>
                            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {/* Body — scrolleable */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block">TIPO</label>
                                <select className="dark-input text-sm" value={editing.type}
                                    onChange={e => setEditing(ed => ed ? { ...ed, type: e.target.value, content: e.target.value === "process" ? {} : ed.content } : ed)}>
                                    {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block">TÍTULO</label>
                                <input className="dark-input text-sm" value={editing.title}
                                    onChange={e => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)} placeholder="Título de la sección" />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block">SUBTÍTULO / DESCRIPCIÓN</label>
                                <textarea className="dark-input text-sm resize-none" rows={3} value={editing.subtitle}
                                    onChange={e => setEditing(ed => ed ? { ...ed, subtitle: e.target.value } : ed)} placeholder="Descripción opcional" />
                            </div>
                            {(editing.type === "cta_banner" || editing.type === "text_block") && (
                                <div>
                                    <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block">TEXTO DEL BOTÓN (opcional)</label>
                                    <input className="dark-input text-sm" value={String((editing.content as Record<string, unknown>)?.button_text ?? "")}
                                        onChange={e => setEditing(ed => ed ? { ...ed, content: { ...ed.content, button_text: e.target.value } } : ed)} placeholder="ej: Ver más" />
                                    <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block mt-2">URL DEL BOTÓN</label>
                                    <input className="dark-input text-sm font-mono" value={String((editing.content as Record<string, unknown>)?.button_url ?? "")}
                                        onChange={e => setEditing(ed => ed ? { ...ed, content: { ...ed.content, button_url: e.target.value } } : ed)} placeholder="/pedido" />
                                </div>
                            )}
                            {editing.type === "stats" && (
                                <div>
                                    <label className="text-xs text-white/40 font-semibold tracking-wider mb-1 block">ESTADÍSTICAS (JSON)</label>
                                    <textarea className="dark-input text-xs font-mono resize-none" rows={5}
                                        value={JSON.stringify((editing.content as Record<string, unknown>)?.stats ?? [], null, 2)}
                                        onChange={e => { try { setEditing(ed => ed ? { ...ed, content: { ...ed.content, stats: JSON.parse(e.target.value) } } : ed); } catch { } }}
                                        placeholder={'[\n  {"label": "Proyectos", "value": "500+"}\n]'} />
                                </div>
                            )}
                            {editing.type === "process" && (() => {
                                const steps = (editing.content?.steps as ProcessStep[] | undefined) ?? [];
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-white/40 font-semibold tracking-wider">PASOS DEL PROCESO</p>
                                            <button type="button" onClick={addModalStep}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20">
                                                <Plus size={12} /> Agregar paso
                                            </button>
                                        </div>
                                        {steps.length === 0 && (
                                            <p className="text-xs text-white/20 text-center py-4">Cargando pasos…</p>
                                        )}
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {steps.map((step, i) => (
                                                <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 space-y-2">
                                                    {/* Row 1 */}
                                                    <div className="flex items-center gap-2">
                                                        <button type="button"
                                                            className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all ${step.active ? "border-green-400 bg-green-400/20" : "border-white/20"}`}
                                                            onClick={() => updateModalStep(i, "active", !step.active)}
                                                            title={step.active ? "Desactivar" : "Activar"}
                                                        />
                                                        <input
                                                            value={step.label}
                                                            onChange={e => updateModalStep(i, "label", e.target.value.toUpperCase())}
                                                            className="dark-input w-24 text-xs font-semibold flex-shrink-0"
                                                            placeholder="IDEA"
                                                        />
                                                        <input
                                                            value={step.description ?? ""}
                                                            onChange={e => updateModalStep(i, "description", e.target.value)}
                                                            className="dark-input flex-1 text-xs"
                                                            placeholder="Descripción"
                                                        />
                                                        <button type="button" onClick={() => removeModalStep(i)} className="text-white/20 hover:text-red-400 flex-shrink-0">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                    {/* Row 2 */}
                                                    <div className="flex items-center gap-3 flex-wrap bg-[#0d0d0d] rounded-lg p-2 border border-[#2a2a2a]/50">
                                                        <div>
                                                            <label className="text-[10px] text-white/50 block mb-1">EMOJI / ÍCONO</label>
                                                            <input
                                                                value={step.icon}
                                                                onChange={e => updateModalStep(i, "icon", e.target.value)}
                                                                className="dark-input w-16 text-center text-xl"
                                                                placeholder="💡"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-white/50 block mb-1">IMAGEN</label>
                                                            <label className="cursor-pointer flex items-center gap-2">
                                                                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/60 flex items-center justify-center overflow-hidden bg-[#1a1a1a] transition-colors">
                                                                    {step.icon_url
                                                                        ? <img src={step.icon_url} alt="" className="w-full h-full object-contain p-0.5" />
                                                                        : <ImageIcon size={14} className="text-white/30" />}
                                                                </div>
                                                                {step.icon_url && (
                                                                    <button type="button" onClick={e => { e.preventDefault(); updateModalStep(i, "icon_url", ""); }}
                                                                        className="text-[10px] text-red-400/70 hover:text-red-400">✕</button>
                                                                )}
                                                                <input type="file" accept="image/*" className="hidden"
                                                                    onChange={e => e.target.files?.[0] && handleModalStepIcon(i, e.target.files[0])} />
                                                            </label>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-white/50 block mb-1">COLOR GLOW</label>
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="color"
                                                                    value={step.icon_color ?? "#00CFFF"}
                                                                    onChange={e => updateModalStep(i, "icon_color", e.target.value)}
                                                                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                                                                />
                                                                {step.icon_color && (
                                                                    <button type="button" onClick={() => updateModalStep(i, "icon_color", "")}
                                                                        className="text-[10px] text-white/40 hover:text-white/70">Reset</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-white/40 font-semibold tracking-wider">ORDEN</label>
                                <input type="number" className="dark-input text-sm w-20" value={editing.sort_order}
                                    onChange={e => setEditing(ed => ed ? { ...ed, sort_order: Number(e.target.value) } : ed)} />
                                <label className="flex items-center gap-2 ml-4 cursor-pointer">
                                    <input type="checkbox" checked={editing.active}
                                        onChange={e => setEditing(ed => ed ? { ...ed, active: e.target.checked } : ed)} />
                                    <span className="text-xs text-white/60">Visible en el home</span>
                                </label>
                            </div>
                        </div>
                        {/* Footer — fijo */}
                        <div className="flex justify-end gap-3 p-5 border-t border-[#2a2a2a] flex-shrink-0">
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-[#3a3a3a] rounded-lg text-white/60 hover:bg-white/5">Cancelar</button>
                            <button type="button" onClick={handleSave} disabled={saving}
                                className="px-4 py-2 text-sm bg-[#00CFFF] text-black rounded-lg font-bold hover:bg-[#00CFFF]/90 disabled:opacity-50">
                                {saving ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Proceso Admin ─────────────────────────────────────────────
function ProcessAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<ProcessConfig>(defaultProcessConfig);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiGet<unknown[]>("/api/process")
            .then(rows => setCfg({
                title: "Que es USER?", steps: rows.map(raw => {
                    const s = raw as Record<string, unknown>;
                    return {
                        icon: String(s.icon ?? ""),
                        label: String(s.label ?? ""),
                        description: String(s.description ?? ""),
                        active: Boolean(s.active),
                        icon_url: s.icon_url ? String(s.icon_url) : undefined,
                        icon_color: s.icon_color ? String(s.icon_color) : undefined,
                    };
                })
            }))
            .catch(() => { });
    }, []);

    const updateStep = (i: number, field: keyof ProcessStep, val: string | boolean) => {
        const steps = [...cfg.steps];
        steps[i] = { ...steps[i], [field]: val };
        setCfg({ ...cfg, steps });
    };

    const handleStepIcon = async (i: number, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "media");
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const { url } = await res.json();
            updateStep(i, "icon_url", url);
        } catch {
            // fallback a base64
            const b64 = await fileToBase64(file);
            updateStep(i, "icon_url", b64);
        }
    };

    const addStep = () => setCfg({
        ...cfg,
        steps: [...cfg.steps, { icon: "?", label: "NUEVO", description: "", active: true }],
    });

    const removeStep = (i: number) => setCfg({ ...cfg, steps: cfg.steps.filter((_, j) => j !== i) });

    const handleSave = async () => {
        setSaving(true);
        try {
            const steps = cfg.steps.map((s, i) => ({ ...s, sort_order: i + 1 }));
            await apiPut("/api/process", steps);
            onSave("Seccion proceso guardada ✓");
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            {/* Preview */}
            <div className="portal-card">
                <p className="text-xs text-white/40 font-semibold tracking-wider mb-4">VISTA PREVIA</p>
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-0.5 h-5 rounded-full bg-[#FFE000]" />
                        <p className="text-xs font-bold text-white/70">{cfg.title}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {cfg.steps.filter(s => s.active).map((step, i) => (
                            <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 flex flex-col items-center justify-center gap-2 aspect-square">
                                {step.icon_url
                                    ? <img src={step.icon_url} alt={step.label} className="w-8 h-8 object-contain" />
                                    : <span className="text-2xl select-none">{step.icon}</span>
                                }
                                <span className="text-[9px] text-white/50 font-bold tracking-widest text-center">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Titulo */}
            <div className="portal-card space-y-3">
                <label className="text-xs text-white/40 font-semibold tracking-wider">TITULO DE LA SECCION</label>
                <input
                    value={cfg.title}
                    onChange={e => setCfg({ ...cfg, title: e.target.value })}
                    className="dark-input"
                    placeholder="Que es USER?"
                />
            </div>

            {/* Pasos */}
            <div className="portal-card space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/40 font-semibold tracking-wider">PASOS DEL PROCESO</p>
                    <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                        <Plus size={13} /> Agregar paso
                    </button>
                </div>
                <div className="space-y-3">
                    {cfg.steps.map((step, i) => (
                        <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 space-y-3">
                            {/* Row 1: activo + label + descripcion + eliminar */}
                            <div className="flex items-center gap-3">
                                <button
                                    className={`w-5 h-5 rounded-full flex-shrink-0 border-2 transition-all ${step.active ? "border-green-400 bg-green-400/20" : "border-white/20"}`}
                                    onClick={() => updateStep(i, "active", !step.active)}
                                    title={step.active ? "Desactivar" : "Activar"}
                                />
                                <input
                                    value={step.label}
                                    onChange={e => updateStep(i, "label", e.target.value.toUpperCase())}
                                    className="dark-input w-28 text-xs font-semibold flex-shrink-0"
                                    placeholder="IDEA"
                                />
                                <input
                                    value={step.description ?? ""}
                                    onChange={e => updateStep(i, "description", e.target.value)}
                                    className="dark-input flex-1 text-xs"
                                    placeholder="Descripcion breve (opcional)"
                                />
                                <button onClick={() => removeStep(i)} className="text-white/20 hover:text-red-400 flex-shrink-0">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {/* Row 2: icono texto + imagen + color */}
                            <div className="flex items-center gap-4 flex-wrap bg-[#0d0d0d] rounded-lg p-3 border border-[#2a2a2a]/50">
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1 font-semibold tracking-wider">EMOJI / ÍCONO</label>
                                    <input
                                        value={step.icon}
                                        onChange={e => updateStep(i, "icon", e.target.value)}
                                        className="dark-input w-16 text-center text-xl"
                                        placeholder="💡"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1 font-semibold tracking-wider">IMAGEN (reemplaza texto)</label>
                                    <label className="cursor-pointer flex items-center gap-2">
                                        <div className="w-14 h-14 rounded-xl border-2 border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/60 flex items-center justify-center overflow-hidden bg-[#1a1a1a] transition-colors">
                                            {step.icon_url
                                                ? <img src={step.icon_url} alt="" className="w-full h-full object-contain p-1" />
                                                : <ImageIcon size={18} className="text-white/30" />}
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-white/60 font-semibold block">
                                                {step.icon_url ? "Cambiar imagen" : "Subir imagen"}
                                            </span>
                                            {step.icon_url && (
                                                <button type="button" onClick={e => { e.preventDefault(); updateStep(i, "icon_url", ""); }} className="text-[10px] text-red-400/70 hover:text-red-400">✕ Quitar</button>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleStepIcon(i, e.target.files[0])} />
                                    </label>
                                </div>
                                <div>
                                    <label className="text-[11px] text-white/60 block mb-1 font-semibold tracking-wider">COLOR FONDO</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={step.icon_color ?? "#111111"}
                                            onChange={e => updateStep(i, "icon_color", e.target.value)}
                                            className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
                                        />
                                        {step.icon_color && (
                                            <button onClick={() => updateStep(i, "icon_color", "")} className="text-[11px] text-white/50 hover:text-white/80">Reset</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Seccion Proceso"}
            </button>
        </div>
    );
}

// ── Variantes Admin ───────────────────────────────────────────
function VariantsAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [pricing, setPricing] = useState<PricingConfig>(defaultPricingConfig);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPriceType, setNewPriceType] = useState<"fixed" | "percent">("fixed");
    const [newPrice, setNewPrice] = useState("");
    const [newPercent, setNewPercent] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const reload = useCallback(() => {
        apiGet<Variant[]>("/api/variants").then(rows => setVariants(rows.map(v => ({
            ...v,
            price_type: (v.price_type as "fixed" | "percent") ?? "fixed",
            price_percent: Number(v.price_percent ?? 0),
        })))).catch(() => { });
        apiGet<PricingConfig>("/api/pricing").then(setPricing).catch(() => { });
    }, []);
    useEffect(() => { reload(); }, [reload]);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await apiPost("/api/variants", {
                name: newName.trim(),
                description: newDesc.trim(),
                price_type: newPriceType,
                price: newPriceType === "fixed" ? (parseFloat(newPrice) || 0) : 0,
                price_percent: newPriceType === "percent" ? (parseFloat(newPercent) || 0) : 0,
                active: true,
                sort_order: variants.length + 1,
            });
            setNewName(""); setNewDesc(""); setNewPrice(""); setNewPercent(""); setNewPriceType("fixed");
            reload();
            onSave("Variante agregada ✓");
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (v: Variant) => {
        try {
            await apiPut(`/api/variants/${v.id}`, v);
        } catch (e) { onSave("Error: " + String(e)); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar variante?")) return;
        try {
            await apiDelete(`/api/variants/${id}`);
            setVariants(prev => prev.filter(v => v.id !== id));
            onSave("Variante eliminada ✓");
        } catch (e) { onSave("Error: " + String(e)); }
    };

    const updateLocal = (id: number, field: keyof Variant, val: unknown) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
    };

    const currSymbol = pricing.currency === "UYU" ? "$" : "US$";

    return (
        <div className="space-y-4">
            {/* Formulario nueva variante */}
            <div className="portal-card space-y-4">
                <p className="text-xs text-white/40 font-semibold tracking-wider">NUEVA VARIANTE / OPCION EXTRA</p>

                {/* Tipo de precio */}
                <div>
                    <label className="text-[10px] text-white/30 block mb-2">TIPO DE PRECIO ADICIONAL</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setNewPriceType("fixed")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${newPriceType === "fixed" ? "bg-[#00CFFF]/20 border-[#00CFFF] text-[#00CFFF]" : "bg-transparent border-[#2a2a2a] text-white/40 hover:border-[#00CFFF]/40"}`}
                        >
                            <DollarSign size={12} /> Precio fijo
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewPriceType("percent")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${newPriceType === "percent" ? "bg-[#E91E8C]/20 border-[#E91E8C] text-[#E91E8C]" : "bg-transparent border-[#2a2a2a] text-white/40 hover:border-[#E91E8C]/40"}`}
                        >
                            <Percent size={12} /> Porcentaje sobre precio base
                        </button>
                    </div>
                    {newPriceType === "percent" && (
                        <p className="text-[10px] text-white/30 mt-1.5">Ej: si el producto vale {currSymbol} 100 y la variante es 15%, se suman {currSymbol} 15 al total.</p>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                        <label className="text-[10px] text-white/30 block mb-1">NOMBRE</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="dark-input text-sm" placeholder="Ej: Laminado UV, Ojales..." />
                    </div>
                    <div>
                        {newPriceType === "fixed" ? (
                            <>
                                <label className="text-[10px] text-white/30 block mb-1">PRECIO ADICIONAL ({pricing.currency === "UYU" ? "$UYU" : "US$"})</label>
                                <input value={newPrice} onChange={e => setNewPrice(e.target.value)} className="dark-input text-sm" type="number" step="0.01" placeholder="0.00" />
                            </>
                        ) : (
                            <>
                                <label className="text-[10px] text-[#E91E8C]/70 block mb-1">PORCENTAJE (%)</label>
                                <input value={newPercent} onChange={e => setNewPercent(e.target.value)} className="dark-input text-sm border-[#E91E8C]/30 focus:border-[#E91E8C]/60" type="number" step="0.1" placeholder="15" />
                            </>
                        )}
                    </div>
                    <div className="col-span-3">
                        <label className="text-[10px] text-white/30 block mb-1">DESCRIPCION (opcional)</label>
                        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="dark-input text-xs" placeholder="Descripcion breve de la variante" />
                    </div>
                </div>
                <button onClick={handleAdd} disabled={saving || !newName.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E91E8C]/20 text-[#E91E8C] text-sm font-semibold hover:bg-[#E91E8C]/30 disabled:opacity-40 transition-colors">
                    <Plus size={14} /> Agregar Variante
                </button>
            </div>

            {/* Lista */}
            <div className="portal-card !p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1a1a1a]">
                    <p className="text-xs text-white/40 font-semibold tracking-wider">VARIANTES GLOBALES ({variants.length})</p>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                    {variants.map(v => (
                        <div key={v.id} className="px-4 py-3 hover:bg-white/[0.02] space-y-2">
                            <div className="flex items-center gap-3">
                                {/* Activo */}
                                <button
                                    className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all ${v.active ? "border-green-400 bg-green-400/20" : "border-white/20"}`}
                                    onClick={() => { const u = { ...v, active: !v.active }; updateLocal(v.id, "active", !v.active); handleUpdate(u); }}
                                />
                                {/* Nombre */}
                                <input
                                    value={v.name}
                                    onChange={e => updateLocal(v.id, "name", e.target.value)}
                                    onBlur={() => handleUpdate(v)}
                                    className="flex-1 bg-transparent text-sm text-white border-b border-transparent focus:border-[#00CFFF]/50 outline-none py-0.5"
                                />
                                {/* Descripcion */}
                                <input
                                    value={v.description ?? ""}
                                    onChange={e => updateLocal(v.id, "description", e.target.value)}
                                    onBlur={() => handleUpdate(v)}
                                    className="w-40 bg-transparent text-xs text-white/40 border-b border-transparent focus:border-[#00CFFF]/30 outline-none py-0.5"
                                    placeholder="Descripcion..."
                                />
                                {/* Tipo toggle */}
                                <button
                                    type="button"
                                    title={v.price_type === "fixed" ? "Cambiar a porcentaje" : "Cambiar a precio fijo"}
                                    onClick={() => {
                                        const u = { ...v, price_type: v.price_type === "fixed" ? "percent" as const : "fixed" as const };
                                        updateLocal(v.id, "price_type", u.price_type);
                                        handleUpdate(u);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border flex-shrink-0 transition-all ${v.price_type === "percent" ? "border-[#E91E8C]/60 text-[#E91E8C] bg-[#E91E8C]/10" : "border-[#00CFFF]/40 text-[#00CFFF] bg-[#00CFFF]/10"}`}
                                >
                                    {v.price_type === "percent" ? <><Percent size={10} /> %</> : <><DollarSign size={10} /> fijo</>}
                                </button>
                                {/* Valor */}
                                {v.price_type === "fixed" ? (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-xs text-white/30">+{pricing.currency === "UYU" ? "$" : "US$"}</span>
                                        <input
                                            value={v.price}
                                            onChange={e => updateLocal(v.id, "price", parseFloat(e.target.value) || 0)}
                                            onBlur={() => handleUpdate(v)}
                                            className="dark-input py-1 text-xs w-20 text-right"
                                            type="number" step="0.01"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-xs text-[#E91E8C]/60">+</span>
                                        <input
                                            value={v.price_percent}
                                            onChange={e => updateLocal(v.id, "price_percent", parseFloat(e.target.value) || 0)}
                                            onBlur={() => handleUpdate(v)}
                                            className="dark-input py-1 text-xs w-16 text-right border-[#E91E8C]/30"
                                            type="number" step="0.1"
                                        />
                                        <span className="text-xs text-[#E91E8C]/60">%</span>
                                    </div>
                                )}
                                <button onClick={() => handleDelete(v.id)} className="text-white/20 hover:text-red-400 flex-shrink-0">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {/* Badge resumen */}
                            <div className="pl-7">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.price_type === "percent" ? "bg-[#E91E8C]/10 text-[#E91E8C]/70" : "bg-[#00CFFF]/10 text-[#00CFFF]/70"}`}>
                                    {v.price_type === "percent"
                                        ? `+${v.price_percent}% del precio base`
                                        : v.price > 0 ? `+${variantPriceLabel(v, undefined, pricing)}` : "incluido (sin cargo)"}
                                </span>
                            </div>
                        </div>
                    ))}
                    {variants.length === 0 && (
                        <p className="text-center text-xs text-white/20 py-8">No hay variantes. Crea una arriba.</p>
                    )}
                </div>
            </div>
            <p className="text-xs text-white/30 text-center">Las variantes activas aparecen como opciones en cada producto desde &quot;Servicios &amp; Productos&quot;</p>
        </div>
    );
}

// ── Precios / Moneda Admin ────────────────────────────────────
function PricingAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<PricingConfig>(defaultPricingConfig);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiGet<PricingConfig>("/api/pricing")
            .then(val => setCfg({ ...defaultPricingConfig, ...val }))
            .catch(() => { });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiPut("/api/pricing", cfg);
            onSave("Configuracion de precios guardada ✓");
        } catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    // Preview examples
    const exampleUSD = 50;
    const exampleUYU = exampleUSD * cfg.uyu_rate;

    return (
        <div className="space-y-6">
            {/* Moneda principal */}
            <div className="portal-card space-y-4">
                <p className="text-xs text-white/40 font-semibold tracking-wider">MONEDA PRINCIPAL</p>
                <div className="flex gap-3">
                    {(["USD", "UYU"] as const).map(cur => (
                        <button
                            key={cur}
                            type="button"
                            onClick={() => setCfg(c => ({ ...c, currency: cur }))}
                            className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all ${cfg.currency === cur ? "border-[#00CFFF] bg-[#00CFFF]/10 text-[#00CFFF]" : "border-[#2a2a2a] text-white/30 hover:border-[#00CFFF]/40"}`}
                        >
                            {cur === "USD" ? "🇺🇸 Dólar (USD)" : "🇺🇾 Peso Uruguayo (UYU)"}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-white/30">
                    Los precios en el sistema se guardan en <span className="text-white/60 font-medium">USD</span>. Esta configuracion define como se muestran al cliente.
                </p>
            </div>

            {/* Cotizacion */}
            <div className="portal-card space-y-4">
                <p className="text-xs text-white/40 font-semibold tracking-wider">COTIZACION DEL DOLAR</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] text-white/30 block mb-2">1 USD =</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.5"
                                min="1"
                                value={cfg.uyu_rate}
                                onChange={e => setCfg(c => ({ ...c, uyu_rate: parseFloat(e.target.value) || 43 }))}
                                className="dark-input text-2xl font-bold w-32 text-right"
                            />
                            <span className="text-lg text-white/50 font-semibold">$ UYU</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#0d0d0d] rounded-xl p-4 space-y-2">
                        <p className="text-[10px] text-white/30 font-semibold tracking-wider">EJEMPLO DE CONVERSION</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-white/50">US$ {exampleUSD.toFixed(2)}</span>
                            <span className="text-xs text-white/30">→</span>
                            <span className="text-sm font-bold text-[#00CFFF]">$ {exampleUYU.toLocaleString("es-UY", { minimumFractionDigits: 0 })} UYU</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Opciones de display */}
            <div className="portal-card space-y-4">
                <p className="text-xs text-white/40 font-semibold tracking-wider">OPCIONES DE VISUALIZACION</p>
                <label className="flex items-center gap-3 cursor-pointer">
                    <button
                        type="button"
                        onClick={() => setCfg(c => ({ ...c, show_both: !c.show_both }))}
                        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${cfg.show_both ? "bg-[#00CFFF]" : "bg-[#2a2a2a]"}`}
                    >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cfg.show_both ? "left-5" : "left-0.5"}`} />
                    </button>
                    <div>
                        <p className="text-sm text-white/80">Mostrar ambas monedas al cliente</p>
                        <p className="text-xs text-white/30">El precio aparecerá como: <span className="text-white/50 font-mono">US$ 50.00 / $ 2,150 UYU</span></p>
                    </div>
                </label>

                {/* Preview */}
                <div className="bg-[#0d0d0d] rounded-xl p-4 space-y-3">
                    <p className="text-[10px] text-white/30 font-semibold tracking-wider">PREVIEW — ASI SE VE EL PRECIO</p>
                    <div className="flex flex-col gap-2">
                        {[10, 25, 100].map(usd => (
                            <div key={usd} className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                                <span className="text-xs text-white/40">Producto US$ {usd}</span>
                                <span className="text-sm font-bold text-white">
                                    {cfg.show_both
                                        ? `US$ ${usd.toFixed(2)} / $ ${(usd * cfg.uyu_rate).toLocaleString("es-UY", { minimumFractionDigits: 0 })} UYU`
                                        : cfg.currency === "UYU"
                                            ? `$ ${(usd * cfg.uyu_rate).toLocaleString("es-UY", { minimumFractionDigits: 0 })} UYU`
                                            : `US$ ${usd.toFixed(2)}`
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Configuracion de Precios"}
            </button>
        </div>
    );
}
function FooterAdmin({ onSave }: { onSave: (msg: string) => void }) {
    const [cfg, setCfg] = useState<FooterConfig>(defaultFooterConfig);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiGet<FooterConfig | null>("/api/config?key=footer")
            .then(val => { if (val) setCfg({ ...defaultFooterConfig, ...val }); })
            .catch(() => { });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try { await apiPut("/api/config", { key: "footer", value: cfg }); onSave("Footer guardado ✓"); }
        catch (e) { onSave("Error: " + String(e)); }
        finally { setSaving(false); }
    };

    const updateSocial = (i: number, field: keyof SocialLink, val: string) => {
        const social = [...cfg.social];
        social[i] = { ...social[i], [field]: val };
        setCfg({ ...cfg, social });
    };

    return (
        <div className="space-y-6 max-w-2xl">

            {/* Redes sociales */}
            <div className="portal-card space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white/40 font-semibold tracking-wider">REDES SOCIALES</p>
                    <button onClick={() => setCfg({ ...cfg, social: [...cfg.social, { platform: "Red Social", url: "https://" }] })}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                        <Plus size={12} /> Agregar
                    </button>
                </div>
                {cfg.social.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input value={s.platform} onChange={e => updateSocial(i, "platform", e.target.value)}
                            className="dark-input w-32 text-xs flex-shrink-0" placeholder="Instagram" />
                        <input value={s.url} onChange={e => updateSocial(i, "url", e.target.value)}
                            className="dark-input flex-1 text-xs font-mono" placeholder="https://..." />
                        <button onClick={() => setCfg({ ...cfg, social: cfg.social.filter((_, j) => j !== i) })}
                            className="text-white/20 hover:text-red-400 flex-shrink-0"><Trash2 size={13} /></button>
                    </div>
                ))}
            </div>

            {/* Showroom */}
            <div className="portal-card space-y-3">
                <p className="text-xs text-white/40 font-semibold tracking-wider">SHOWROOM</p>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">DIRECCIÓN</label>
                    <input value={cfg.showroom_address} onChange={e => setCfg({ ...cfg, showroom_address: e.target.value })}
                        className="dark-input text-sm" placeholder="Arenal Grande 2667, Montevideo" />
                </div>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">URL GOOGLE MAPS</label>
                    <input value={cfg.showroom_maps_url} onChange={e => setCfg({ ...cfg, showroom_maps_url: e.target.value })}
                        className="dark-input text-xs font-mono" placeholder="https://maps.google.com/..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-white/30 mb-1 block">LATITUD</label>
                        <input type="number" step="0.0001" value={cfg.showroom_lat}
                            onChange={e => setCfg({ ...cfg, showroom_lat: parseFloat(e.target.value) || 0 })}
                            className="dark-input text-xs font-mono" />
                    </div>
                    <div>
                        <label className="text-[10px] text-white/30 mb-1 block">LONGITUD</label>
                        <input type="number" step="0.0001" value={cfg.showroom_lng}
                            onChange={e => setCfg({ ...cfg, showroom_lng: parseFloat(e.target.value) || 0 })}
                            className="dark-input text-xs font-mono" />
                    </div>
                </div>
            </div>

            {/* WhatsApp + Contacto */}
            <div className="portal-card space-y-3">
                <p className="text-xs text-white/40 font-semibold tracking-wider">WHATSAPP Y CONTACTO</p>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">NÚMERO WHATSAPP (con código país, sin +)</label>
                    <input value={cfg.whatsapp_number} onChange={e => setCfg({ ...cfg, whatsapp_number: e.target.value })}
                        className="dark-input font-mono text-sm" placeholder="59899000000" />
                </div>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">MENSAJE PREDEFINIDO</label>
                    <input value={cfg.whatsapp_text} onChange={e => setCfg({ ...cfg, whatsapp_text: e.target.value })}
                        className="dark-input text-sm" placeholder="Hola! Quiero consultar..." />
                </div>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">URL "SUMATE AL EQUIPO"</label>
                    <input value={cfg.join_team_url} onChange={e => setCfg({ ...cfg, join_team_url: e.target.value })}
                        className="dark-input text-xs font-mono" placeholder="/contacto" />
                </div>
            </div>

            {/* Pagos + Copyright */}
            <div className="portal-card space-y-3">
                <p className="text-xs text-white/40 font-semibold tracking-wider">PAGOS Y COPYRIGHT</p>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">MÉTODOS DE PAGO (separados por coma)</label>
                    <input
                        value={cfg.payment_methods.join(", ")}
                        onChange={e => setCfg({ ...cfg, payment_methods: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        className="dark-input text-sm" placeholder="Mercado Pago, Handy" />
                </div>
                <div>
                    <label className="text-[10px] text-white/30 mb-1 block">TEXTO COPYRIGHT</label>
                    <input value={cfg.copyright} onChange={e => setCfg({ ...cfg, copyright: e.target.value })}
                        className="dark-input text-sm" placeholder="© 2026 USER. Todos los derechos reservados." />
                </div>
            </div>

            <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-lg bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Footer"}
            </button>
        </div>
    );
}

// ── Panel Admin principal ─────────────────────────────────────
export default function AdminPanel() {
    const [authed, setAuthed] = useState(false);
    const [pwInput, setPwInput] = useState("");
    const [pwError, setPwError] = useState("");
    const [active, setActive] = useState("dashboard");
    const [toast, setToast] = useState("");
    const showToast = useCallback((msg: string) => setToast(msg), []);

    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "1") setAuthed(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError("");
        try {
            const res = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pwInput }) });
            if (res.ok) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); }
            else { setPwError("Contraseña incorrecta"); }
        } catch { setPwError("Error de conexión"); }
    };

    if (!authed) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <form onSubmit={handleLogin} className="portal-card w-full max-w-sm space-y-5">
                <div className="text-center space-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00CFFF] to-[#E91E8C] mx-auto flex items-center justify-center mb-3">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-lg font-black text-white">Panel Admin</h2>
                    <p className="text-xs text-white/40">Ingresa la contraseña de administrador</p>
                </div>
                <div>
                    <label className="text-xs text-white/40 mb-1 block">Contraseña</label>
                    <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)} className="dark-input w-full" placeholder="••••••••" autoFocus />
                    {pwError && <p className="text-xs text-red-400 mt-1">{pwError}</p>}
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors">Ingresar</button>
            </form>
        </div>
    );

    const sections: Record<string, React.ReactNode> = {
        dashboard: <DashboardSection />,
        pedidos: <OrdersAdmin />,
        nuevo_pedido: <NuevoPedidoAdmin onSave={showToast} />,
        clientes: <ClientsAdmin />,
        servicios: <ServicesAdmin onSave={showToast} />,
        variantes: <VariantsAdmin onSave={showToast} />,
        precios: <PricingAdmin onSave={showToast} />,
        pagos: <PaymentGatewaysAdmin onSave={showToast} />,
        home: <HomeSectionsAdmin onSave={showToast} />,
        logo: <LogoAdmin onSave={showToast} />,
        menu: <MenuAdmin onSave={showToast} />,
        paginas: <PagesAdmin onSave={showToast} />,
        sitio: <SiteConfigAdmin onSave={showToast} />,
        footer: <FooterAdmin onSave={showToast} />,
    };

    const currentItem = ADMIN_SECTIONS.find(s => s.id === active);

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            {toast && <Toast msg={toast} onDone={() => setToast("")} />}

            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-[#1a1a1a] flex-shrink-0">
                    <div className="flex flex-col leading-none">
                        <span className="text-2xl font-black italic text-white">user</span>
                        <div className="flex gap-[3px] mt-[2px]">
                            {["#00CFFF", "#E91E8C", "#FFE000", "#FFFFFF"].map((c, i) => (
                                <div key={i} className="h-[3px] w-[12px] rounded-sm" style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] text-[#E91E8C] mt-2 font-semibold tracking-widest">PANEL ADMIN</p>
                </div>
                <nav className="flex-1 p-3 space-y-0.5">
                    {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActive(id)}
                            className={`sidebar-item w-full text-left ${active === id ? "active" : ""}`}
                        >
                            <Icon size={15} /><span className="truncate">{label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-[#1a1a1a] flex-shrink-0">
                    <a href="/" className="sidebar-item w-full text-left text-[#00CFFF]/70 hover:text-[#00CFFF] flex items-center gap-3"><Eye size={14} /><span>Ver Sitio Publico</span></a>
                    <a href="/portal" className="sidebar-item w-full text-left text-white/30 hover:text-white/60 flex items-center gap-3 mt-1"><Users size={14} /><span>Ver Portal Usuario</span></a>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-[#1a1a1a] px-8 py-4">
                    {currentItem && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/40">Admin</span>
                            <ChevronRight size={14} className="text-white/20" />
                            <span className="text-white font-medium">{currentItem.label}</span>
                        </div>
                    )}
                </div>
                <div className="p-8">{sections[active] ?? null}</div>
            </main>
        </div>
    );
}
