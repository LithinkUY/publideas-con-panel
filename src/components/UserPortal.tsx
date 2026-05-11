"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    User, Package, LogOut, ChevronRight, ChevronDown, Check, Loader2,
    AlertCircle, Upload, Download, ArrowLeft, Eye, Grid3X3, Truck,
    CreditCard, Clock, MessageSquare, Edit3, X, MapPin, Calendar,
    Phone, Building2, Layers,
} from "lucide-react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
    client_id: number;
    client_code: string;
    name: string;
    email: string;
    pin_code?: string;
}

interface OrderFile {
    id: number;
    file_name: string;
    file_data: string;
    file_type: string;
    uploaded_by: string;
    created_at: string;
}

interface OrderItem {
    product: string;
    service: string;
    quantity: number;
    total: number;
    currency: string;
    variants?: string[];
    width?: number;
    height?: number;
    m2?: number;
    notes?: string;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    description?: string;
    total_amount?: number;
    total?: number;
    currency?: string;
    payment_method?: string;
    created_at: string;
    updated_at?: string;
    items?: OrderItem[];
    order_files?: OrderFile[];
    despacho_fecha?: string | null;
    despacho_hora?: string | null;
    despacho_notas?: string | null;
    retiro?: { tipo: string; bus_company?: string; direccion?: string; horario?: string; receptor?: string; notes?: string } | null;
}

interface ServiceData {
    id: number;
    slug: string;
    name: string;
    description: string;
}

interface ShippingType {
    id: number;
    name: string;
    description: string;
    type: "cadeteria" | "agencia" | "tres_cruces" | "otro";
    price: number;
    active: boolean;
}

interface ShippingAgency {
    id: number;
    name: string;
    description: string;
}

interface Retiro {
    id: number;
    retiro_number: string;
    order_ids: number[];
    tipo: "retiro" | "envio";
    status: string;
    shipping_type_name?: string;
    shipping_type_code?: string;
    agency_name?: string;
    bus_company?: string;
    direccion?: string;
    horario?: string;
    receptor?: string;
    shipping_cost: number;
    created_at: string;
}

type Section = "perfil" | "servicios" | "retiro" | "pagos" | "historial" | "soporte";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const sz = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" }[size];
    return (
        <div className={`${sz} rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center font-black text-[#00CFFF] flex-shrink-0`}>
            {initials}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status.toUpperCase();
    const color = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] ?? "bg-white/10 text-white/60 border-white/20";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}

function RetiroStatusBadge({ status }: { status: string }) {
    const MAP: Record<string, { label: string; cls: string }> = {
        pendiente: { label: "PENDIENTE", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
        procesando: { label: "PROCESANDO", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        entregado: { label: "ENTREGADO", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
        cancelado: { label: "CANCELADO", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    const { label, cls } = MAP[status] ?? { label: status.toUpperCase(), cls: "bg-white/10 text-white/50 border-white/10" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>;
}

function formatAmt(amount: number | undefined, currency?: string) {
    if (!amount) return "–";
    if (currency === "UYU") return `$${Number(amount).toLocaleString("es-UY", { minimumFractionDigits: 0 })}`;
    return `US$ ${Number(amount).toFixed(2)}`;
}

const SVC_ICONS: Record<string, string> = {
    sublimacion: "🎨", dtf: "🖨️", ecouv: "🖼️", bordado: "✂️",
    corte: "⚡", tpu: "📦", directa: "🖨️", ayuda: "🎯",
};

function InfoRow({ icon, label, value, mono, secret }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; secret?: boolean }) {
    const [show, setShow] = useState(!secret);
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a]">
            <span className="text-white/20">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white/20 uppercase tracking-wider">{label}</p>
                <p className={`text-sm text-white/70 truncate ${mono ? "font-mono" : ""}`}>{secret && !show ? "••••" : value}</p>
            </div>
            {secret && <button onClick={() => setShow(s => !s)} className="text-white/20 hover:text-white/50"><Eye size={13} /></button>}
        </div>
    );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
    const [email, setEmail] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setErr("");
        try {
            const res = await fetch("/api/portal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin_code: pin }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Credenciales incorrectas");
            const s: Session = { client_id: data.id, client_code: data.client_code, name: data.name, email: data.email };
            localStorage.setItem("portal_session", JSON.stringify(s));
            onLogin(s);
        } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center mx-auto">
                        <User size={24} className="text-[#00CFFF]" />
                    </div>
                    <h1 className="text-xl font-black text-white">PANEL DE CLIENTE</h1>
                    <p className="text-xs text-white/40">Ingresá con tu email y PIN de acceso</p>
                </div>
                <form onSubmit={submit} className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/50"
                            placeholder="tu@email.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">PIN de acceso</label>
                        <input type="password" value={pin} onChange={e => setPin(e.target.value)} required maxLength={8}
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/50 text-center tracking-widest text-lg font-black"
                            placeholder="••••" />
                    </div>
                    {err && (
                        <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-400">{err}</p>
                        </div>
                    )}
                    <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-xl bg-[#00CFFF] text-black font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={16} className="animate-spin" />Ingresando...</> : "Ingresar"}
                    </button>
                </form>
                <p className="text-center text-xs text-white/20">
                    ¿No tenés pedidos? <Link href="/pedido" className="text-[#00CFFF]/60 hover:text-[#00CFFF]">Hacé tu primer pedido</Link>
                </p>
            </div>
        </div>
    );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
    const [uploading, setUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadErr, setUploadErr] = useState("");
    const [currentStatus, setCurrentStatus] = useState(order.status);
    const canUpload = currentStatus === "pendiente_pago" || currentStatus === "comprobante_enviado";
    const amtTotal = order.total_amount ?? order.total;

    const handleUpload = (file: File) => {
        setUploading(true); setUploadErr("");
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const res = await fetch(`/api/orders/${order.id}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file_name: file.name, file_data: e.target?.result, file_type: file.type, uploaded_by: "client" }),
                });
                if (!res.ok) throw new Error();
                setUploadDone(true); setCurrentStatus("comprobante_enviado");
            } catch { setUploadErr("No se pudo subir el archivo"); }
            finally { setUploading(false); }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-5">
            <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
                <ArrowLeft size={16} /> Volver
            </button>
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs text-white/40 mb-1">N° de orden</p>
                        <p className="text-lg font-black text-[#00CFFF] font-mono">{order.order_number}</p>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>
                <div className="border-t border-[#2a2a2a] pt-3 flex justify-between items-center">
                    <span className="text-xs text-white/40">Total</span>
                    <span className="text-xl font-black text-white">{formatAmt(amtTotal, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-white/40">Fecha</span>
                    <span className="text-xs text-white/60">{new Date(order.created_at).toLocaleDateString("es-UY")}</span>
                </div>
            </div>

            {(order.items?.length ?? 0) > 0 && (
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Productos</p>
                    {order.items!.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
                            <div>
                                <p className="text-sm font-semibold text-white">{item.product}</p>
                                <p className="text-xs text-white/40">{item.service}</p>
                                {item.m2 && <p className="text-[10px] text-white/30">{item.width}x{item.height}m = {Number(item.m2).toFixed(2)}m²</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-white/30">x{item.quantity}</p>
                                <p className="text-sm font-bold text-[#00CFFF]">{formatAmt(item.total, item.currency)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(order.order_files?.length ?? 0) > 0 && (
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-2">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Archivos</p>
                    {order.order_files!.map(f => (
                        <div key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#1a1a1a] last:border-0">
                            <div>
                                <p className="text-xs text-white font-semibold">{f.file_name}</p>
                                <p className="text-[10px] text-white/30">{f.uploaded_by === "client" ? "Subido por vos" : "Del equipo"}</p>
                            </div>
                            <button onClick={() => { const a = document.createElement("a"); a.href = f.file_data; a.download = f.file_name; a.click(); }}
                                className="flex items-center gap-1 text-[10px] text-[#00CFFF] hover:opacity-70">
                                <Download size={12} /> Descargar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {canUpload && (
                <div className="bg-[#0d0d0d] border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-wider mb-3">Adjuntar comprobante de pago</p>
                    {uploadDone ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check size={16} /> Comprobante enviado.</div>
                    ) : (
                        <label className="cursor-pointer block">
                            <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed text-sm font-semibold transition-colors ${uploading ? "border-white/10 text-white/20" : "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/5"}`}>
                                {uploading ? <><Loader2 size={16} className="animate-spin" />Subiendo...</> : <><Upload size={16} />Subir comprobante</>}
                            </div>
                            {uploadErr && <p className="text-xs text-red-400 mt-1">{uploadErr}</p>}
                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                        </label>
                    )}
                </div>
            )}

            {/* Despacho info */}
            {(order.despacho_fecha || order.despacho_hora || order.despacho_notas) && (
                <div className="bg-[#0d2a1a] border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Truck size={15} className="text-emerald-400" />
                        <p className="text-sm font-bold text-emerald-400">Información de despacho</p>
                    </div>
                    {order.despacho_fecha && (
                        <p className="text-xs text-white"><span className="text-white/40">📅 Fecha: </span><span className="font-semibold">{new Date(order.despacho_fecha + "T12:00:00").toLocaleDateString("es-UY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></p>
                    )}
                    {order.despacho_hora && (
                        <p className="text-xs text-white"><span className="text-white/40">🕐 Hora: </span><span className="font-semibold">{order.despacho_hora.slice(0,5)}</span></p>
                    )}
                    {order.despacho_notas && (
                        <p className="text-xs text-white/70 italic">{order.despacho_notas}</p>
                    )}
                </div>
            )}

            <a href={`https://wa.me/?text=${encodeURIComponent(`Consulta sobre pedido ${order.order_number}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-colors">
                Consultar por WhatsApp
            </a>
        </div>
    );
}

// ─── Retiro Modal ─────────────────────────────────────────────────────────────
function RetiroModal({ selectedOrders, orders, shippingTypes, agencies, clientId, onClose, onCreated }: {
    selectedOrders: number[];
    orders: Order[];
    shippingTypes: ShippingType[];
    agencies: ShippingAgency[];
    clientId: number;
    onClose: () => void;
    onCreated: (r: Retiro) => void;
}) {
    const [tipo, setTipo] = useState<"retiro" | "envio">("retiro");
    const [shippingTypeId, setShippingTypeId] = useState<number | null>(null);
    const [agencyId, setAgencyId] = useState<number | null>(null);
    const [busCompany, setBusCompany] = useState("");
    const [direccion, setDireccion] = useState("");
    const [horario, setHorario] = useState("");
    const [receptor, setReceptor] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const selShipping = shippingTypes.find(s => s.id === shippingTypeId);
    const shippingCost = tipo === "envio" ? (selShipping?.price ?? 0) : 0;
    const selOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    const orderTotal = selOrdersData.reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0);

    const submit = async () => {
        setErr("");
        if (tipo === "envio") {
            if (!shippingTypeId) return setErr("Seleccioná el tipo de envio.");
            if (selShipping?.type === "agencia" && !agencyId) return setErr("Seleccioná la agencia.");
            if (!receptor.trim()) return setErr("Ingresá el nombre de quien recibe.");
        }
        setLoading(true);
        try {
            const res = await fetch("/api/retiros", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: clientId,
                    order_ids: selectedOrders,
                    tipo,
                    shipping_type_id: tipo === "envio" ? shippingTypeId : null,
                    agency_id: tipo === "envio" && selShipping?.type === "agencia" ? agencyId : null,
                    bus_company: tipo === "envio" && selShipping?.type === "tres_cruces" ? busCompany : null,
                    direccion: tipo === "envio" ? direccion : null,
                    horario: tipo === "envio" ? horario : null,
                    receptor: tipo === "envio" ? receptor : null,
                    shipping_cost: shippingCost,
                }),
            });
            if (!res.ok) throw new Error("Error al crear el retiro");
            onCreated(await res.json());
        } catch (e) { setErr(String(e)); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                    <h3 className="font-black text-white text-sm">CONFIRMAR RETIRO / ENVIO</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Ordenes seleccionadas</p>
                        {selOrdersData.map(o => (
                            <div key={o.id} className="flex justify-between items-center">
                                <span className="text-xs font-mono text-[#00CFFF]">{o.order_number}</span>
                                <span className="text-xs text-white/60">{formatAmt(o.total_amount ?? o.total, o.currency)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setTipo("retiro")}
                            className={`p-4 rounded-xl border text-left transition-colors ${tipo === "retiro" ? "border-[#00CFFF] bg-[#00CFFF]/5" : "border-[#2a2a2a] hover:border-white/20"}`}>
                            <Building2 size={20} className={tipo === "retiro" ? "text-[#00CFFF]" : "text-white/30"} />
                            <p className={`text-sm font-bold mt-2 ${tipo === "retiro" ? "text-white" : "text-white/40"}`}>Retiro en local</p>
                            <p className="text-[10px] text-white/30 mt-0.5">Retirás en Publideas</p>
                        </button>
                        <button onClick={() => setTipo("envio")}
                            className={`p-4 rounded-xl border text-left transition-colors ${tipo === "envio" ? "border-[#00CFFF] bg-[#00CFFF]/5" : "border-[#2a2a2a] hover:border-white/20"}`}>
                            <Truck size={20} className={tipo === "envio" ? "text-[#00CFFF]" : "text-white/30"} />
                            <p className={`text-sm font-bold mt-2 ${tipo === "envio" ? "text-white" : "text-white/40"}`}>Envio</p>
                            <p className="text-[10px] text-white/30 mt-0.5">Te lo enviamos</p>
                        </button>
                    </div>

                    {tipo === "envio" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">Tipo de envio</label>
                                <div className="space-y-2">
                                    {shippingTypes.filter(s => s.active).map(s => (
                                        <button key={s.id} onClick={() => { setShippingTypeId(s.id); setAgencyId(null); setBusCompany(""); }}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${shippingTypeId === s.id ? "border-[#00CFFF] bg-[#00CFFF]/5" : "border-[#2a2a2a] hover:border-white/20"}`}>
                                            <div>
                                                <p className={`text-sm font-semibold ${shippingTypeId === s.id ? "text-white" : "text-white/60"}`}>{s.name}</p>
                                                {s.description && <p className="text-[10px] text-white/30">{s.description}</p>}
                                            </div>
                                            <span className={`text-sm font-bold ${shippingTypeId === s.id ? "text-[#00CFFF]" : "text-white/30"}`}>
                                                {s.price > 0 ? `US$ ${s.price.toFixed(2)}` : "GRATIS"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selShipping?.type === "agencia" && (
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">Agencia de transporte</label>
                                    <select value={agencyId ?? ""} onChange={e => setAgencyId(Number(e.target.value) || null)}
                                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50">
                                        <option value="">Seleccioná una agencia...</option>
                                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {selShipping?.type === "tres_cruces" && (
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">Empresa de omnibus preferida</label>
                                    <input value={busCompany} onChange={e => setBusCompany(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50"
                                        placeholder="Ej: Copsa, Turil, Nuñez..." />
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">
                                    <MapPin size={10} className="inline mr-1" />
                                    {selShipping?.type === "cadeteria" ? "Dirección de entrega *" : "Dirección (opcional)"}
                                </label>
                                <input value={direccion} onChange={e => setDireccion(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50"
                                    placeholder="Calle, número, barrio..." />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">
                                    <Calendar size={10} className="inline mr-1" />Horario preferido de entrega
                                </label>
                                <input value={horario} onChange={e => setHorario(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50"
                                    placeholder="Ej: Lunes a viernes de 9 a 18hs" />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-2">
                                    <Phone size={10} className="inline mr-1" />Nombre de quien recibe *
                                </label>
                                <input value={receptor} onChange={e => setReceptor(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50"
                                    placeholder="Nombre completo" />
                            </div>
                        </div>
                    )}

                    <div className="bg-[#1a1a1a] rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-white/30 uppercase font-bold">Total pedidos</p>
                            <p className="text-sm font-bold text-white">{formatAmt(orderTotal, "USD")}</p>
                        </div>
                        {tipo === "envio" && shippingCost > 0 && (
                            <div className="text-right">
                                <p className="text-[10px] text-white/30 uppercase font-bold">Costo envio</p>
                                <p className="text-sm font-bold text-[#00CFFF]">US$ {shippingCost.toFixed(2)}</p>
                            </div>
                        )}
                        {tipo === "envio" && shippingCost === 0 && shippingTypeId && (
                            <span className="text-xs font-bold text-emerald-400">Envio GRATIS</span>
                        )}
                    </div>

                    {err && (
                        <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-400">{err}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={submit} disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-[#00CFFF] text-black font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 size={16} className="animate-spin" />Creando...</> : `Confirmar ${tipo === "retiro" ? "Retiro" : "Envio"}`}
                        </button>
                        <button onClick={onClose} className="px-5 py-3 rounded-xl border border-[#2a2a2a] text-white/50 text-sm hover:text-white">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export default function UserPortal() {
    const searchParams = useSearchParams();

    const resolveSection = useCallback((sp: ReturnType<typeof useSearchParams>): Section => {
        const valid: Section[] = ["perfil", "servicios", "retiro", "pagos", "historial", "soporte"];
        const s = sp.get("section");
        if (s === "orders") return "historial";
        if (s === "profile") return "perfil";
        return valid.includes(s as Section) ? (s as Section) : "perfil";
    }, []);

    const [session, setSession] = useState<Session | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [retiros, setRetiros] = useState<Retiro[]>([]);
    const [services, setServices] = useState<ServiceData[]>([]);
    const [shippingTypes, setShippingTypes] = useState<ShippingType[]>([]);
    const [agencies, setAgencies] = useState<ShippingAgency[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [activeSection, setActiveSection] = useState<Section>(() => resolveSection(searchParams));
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [expandedRetiro, setExpandedRetiro] = useState<number | null>(null);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [selectedForRetiro, setSelectedForRetiro] = useState<number[]>([]);
    const [showRetiroModal, setShowRetiroModal] = useState(false);
    const [retiroSuccess, setRetiroSuccess] = useState<string | null>(null);

    useEffect(() => { setActiveSection(resolveSection(searchParams)); }, [searchParams, resolveSection]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("portal_session");
            if (raw) { const s = JSON.parse(raw); if (s.client_id) setSession(s); }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!session?.client_id) return;
        setLoadingOrders(true);
        fetch(`/api/orders?client_id=${session.client_id}`)
            .then(r => r.json()).then((d: Order[]) => setOrders(Array.isArray(d) ? d : []))
            .catch(() => setOrders([])).finally(() => setLoadingOrders(false));
        fetch(`/api/retiros?client_id=${session.client_id}`)
            .then(r => r.json()).then((d: Retiro[]) => setRetiros(Array.isArray(d) ? d : []))
            .catch(() => setRetiros([]));
        fetch("/api/services")
            .then(r => r.json()).then((d: ServiceData[]) => setServices(Array.isArray(d) ? d : []))
            .catch(() => setServices([]));
        fetch("/api/shipping/types")
            .then(r => r.json()).then((d: ShippingType[]) => setShippingTypes(Array.isArray(d) ? d : []))
            .catch(() => setShippingTypes([]));
        fetch("/api/shipping/agencies")
            .then(r => r.json()).then((d: ShippingAgency[]) => setAgencies(Array.isArray(d) ? d : []))
            .catch(() => setAgencies([]));
    }, [session]);

    const handleLogout = () => { localStorage.removeItem("portal_session"); setSession(null); setOrders([]); };

    if (!session) return <LoginScreen onLogin={setSession} />;

    const readyOrders = orders.filter(o => o.status === "pronto_para_entregar" || o.status === "avisado");
    const pendingOrders = orders.filter(o => o.status === "pendiente_pago" || o.status === "comprobante_enviado");
    const retiroTotal = selectedForRetiro.reduce((sum, id) => {
        const o = orders.find(x => x.id === id);
        return sum + Number(o?.total_amount ?? o?.total ?? 0);
    }, 0);

    const NAV: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: "perfil", label: "Mi Perfil", icon: User },
        { id: "servicios", label: "Servicios", icon: Grid3X3 },
        { id: "retiro", label: "Retiro de Pedidos", icon: Package, badge: readyOrders.length || undefined },
        { id: "pagos", label: "Pagos Pendientes", icon: CreditCard, badge: pendingOrders.length || undefined },
        { id: "historial", label: "Historial", icon: Clock },
        { id: "soporte", label: "Soporte / Ayuda", icon: MessageSquare },
    ];

    const goSection = (s: Section) => { setActiveSection(s); setSelectedOrder(null); };

    return (
        <div className="min-h-screen bg-[#080808] flex">
            {/* ── Sidebar ── */}
            <aside className="w-56 flex-shrink-0 border-r border-[#1a1a1a] flex flex-col bg-[#080808] fixed h-full z-40 top-0 left-0">
                <div className="px-5 pt-6 pb-4 border-b border-[#1a1a1a]">
                    <Link href="/">
                        <p className="text-xl font-black text-white italic tracking-tight">user</p>
                        <p className="text-[9px] text-white/30 font-semibold tracking-[0.25em] mt-0.5">AUTOGESTIÓN</p>
                    </Link>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV.map(item => (
                        <button key={item.id} onClick={() => goSection(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeSection === item.id ? "bg-white/8 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/4"}`}>
                            <item.icon size={16} className={activeSection === item.id ? "text-[#00CFFF]" : ""} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge ? (
                                <span className="w-5 h-5 rounded-full bg-[#00CFFF] text-black text-[10px] font-black flex items-center justify-center">{item.badge}</span>
                            ) : null}
                        </button>
                    ))}
                </nav>
                <div className="px-5 py-3 flex gap-2">
                    {["#00CFFF", "#E91E8C", "#FFE000", "#FFFFFF"].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full opacity-70" style={{ backgroundColor: c }} />
                    ))}
                </div>
                <div className="px-4 py-4 border-t border-[#1a1a1a] space-y-3">
                    <div className="flex items-center gap-2.5">
                        <Avatar name={session.name} size="sm" />
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{session.name}</p>
                            <p className="text-[10px] text-white/30 font-mono truncate">{session.client_code}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-white/30 hover:text-red-400 text-xs transition-colors w-full">
                        <LogOut size={13} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="ml-56 flex-1 min-h-screen">
                <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

                    {/* ── MI PERFIL ── */}
                    {activeSection === "perfil" && (
                        <>
                            <div className="flex items-center gap-3">
                                <User size={20} className="text-[#00CFFF]" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Mi <span className="text-[#00CFFF]">Perfil</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Gestión de cuenta y datos de contacto.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-white/70">Datos de Cuenta</p>
                                        <button className="flex items-center gap-1.5 text-xs text-[#00CFFF]/60 hover:text-[#00CFFF] transition-colors">
                                            <Edit3 size={12} /> Editar
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Avatar name={session.name} size="lg" />
                                        <div>
                                            <p className="text-lg font-black text-white">{session.name}</p>
                                            <p className="text-xs text-[#00CFFF]/70 font-mono">{session.client_code}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-[#1a1a1a] pt-3 space-y-0">
                                        <InfoRow icon={<User size={14} />} label="ID CLIENTE" value={session.client_code} mono />
                                        <InfoRow icon={<MessageSquare size={14} />} label="EMAIL" value={session.email} />
                                        {session.pin_code && <InfoRow icon={<Layers size={14} />} label="PIN PORTAL" value={session.pin_code} mono secret />}
                                    </div>
                                    <div className="bg-white/3 rounded-xl p-4 text-center">
                                        <p className="text-[10px] text-white/20 uppercase tracking-wider">Asesor Asignado</p>
                                        <p className="text-xs text-white/40 mt-1">No tenés un asesor asignado actualmente.</p>
                                    </div>
                                </div>
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
                                    <p className="text-sm font-bold text-white/70 mb-4">Últimos Pedidos</p>
                                    {loadingOrders ? (
                                        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-white/20" /></div>
                                    ) : orders.length === 0 ? (
                                        <p className="text-xs text-white/30 text-center py-8">Sin pedidos aún</p>
                                    ) : (
                                        <table className="w-full text-xs">
                                            <thead><tr className="text-white/30 border-b border-[#1a1a1a]">
                                                <th className="text-left pb-2 font-medium">Orden</th>
                                                <th className="text-left pb-2 font-medium">Fecha</th>
                                                <th className="text-left pb-2 font-medium">Total</th>
                                                <th className="text-left pb-2 font-medium">Estado</th>
                                            </tr></thead>
                                            <tbody>
                                                {orders.slice(0, 6).map(o => (
                                                    <tr key={o.id} className="border-b border-[#1a1a1a]/50">
                                                        <td className="py-2.5 font-mono text-[#00CFFF] font-bold text-[11px]">{o.order_number}</td>
                                                        <td className="py-2.5 text-white/40">{new Date(o.created_at).toLocaleDateString("es-UY")}</td>
                                                        <td className="py-2.5 text-white/70">{formatAmt(o.total_amount ?? o.total, o.currency)}</td>
                                                        <td className="py-2.5"><StatusBadge status={o.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── SERVICIOS ── */}
                    {activeSection === "servicios" && (
                        <>
                            <div className="flex items-center gap-3">
                                <Grid3X3 size={20} className="text-[#FFE000]" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Servicios <span className="text-[#FFE000]">Disponibles</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Seleccioná una categoría para comenzar.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {(services.length > 0 ? services : [
                                    { id: 1, slug: "sublimacion", name: "Sublimación", description: "Estampado por calor en poliéster." },
                                    { id: 2, slug: "dtf", name: "DTF", description: "Transferencia digital sobre film." },
                                    { id: 3, slug: "ecouv", name: "ECOUV", description: "Impresión UV alta resolución." },
                                    { id: 4, slug: "bordado", name: "Bordado", description: "Personalización con hilos." },
                                    { id: 5, slug: "corte", name: "Corte", description: "Corte láser y tizada." },
                                    { id: 6, slug: "tpu", name: "TPU", description: "Etiquetas y parches en PU." },
                                    { id: 7, slug: "directa", name: "Directa 3.20m", description: "Gigantografía gran formato." },
                                    { id: 8, slug: "ayuda", name: "Ayuda y Reclamos", description: "Centro de consultas." },
                                ] as ServiceData[]).map(s => (
                                    <button key={s.id} onClick={() => window.open(`/pedido?service=${s.slug}`, "_blank")}
                                        className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#FFE000]/30 hover:bg-[#FFE000]/3 transition-all group aspect-square">
                                        <span className="text-3xl">{SVC_ICONS[s.slug.toLowerCase().replace(/[\s/-]/g, "")] ?? "⚙️"}</span>
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest group-hover:text-[#FFE000]/70 text-center">{s.name}</p>
                                        {s.description && <p className="text-[9px] text-white/20 text-center leading-tight">{s.description}</p>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── RETIRO DE PEDIDOS ── */}
                    {activeSection === "retiro" && !selectedOrder && (
                        <>
                            <div className="flex items-center gap-3">
                                <Package size={20} className="text-[#FFE000]" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Gestión de <span className="text-[#FFE000]">Retiros</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Seleccioná las órdenes que deseás retirar.</p>
                                </div>
                            </div>
                            {retiroSuccess && (
                                <div className="flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                                    <Check size={16} className="text-emerald-400" />
                                    <p className="text-sm text-emerald-400">Retiro <strong>{retiroSuccess}</strong> creado. Te contactaremos pronto.</p>
                                    <button onClick={() => setRetiroSuccess(null)} className="ml-auto text-emerald-400/50 hover:text-emerald-400"><X size={14} /></button>
                                </div>
                            )}
                            {readyOrders.length === 0 ? (
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-12 text-center space-y-3">
                                    <Package size={40} className="mx-auto text-white/10" />
                                    <p className="text-sm text-white/30">No tenés pedidos listos para retirar en este momento.</p>
                                </div>
                            ) : (
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="border-b border-[#1a1a1a]">
                                            <tr className="text-[10px] text-white/30 uppercase tracking-wider">
                                                <th className="p-4 w-10">
                                                    <input type="checkbox"
                                                        checked={selectedForRetiro.length === readyOrders.length && readyOrders.length > 0}
                                                        onChange={e => setSelectedForRetiro(e.target.checked ? readyOrders.map(o => o.id) : [])}
                                                        className="w-4 h-4 rounded accent-[#00CFFF]" />
                                                </th>
                                                <th className="p-4 text-left">Orden</th>
                                                <th className="p-4 text-left">Descripción</th>
                                                <th className="p-4 text-left">Estado</th>
                                                <th className="p-4 text-right">Fecha</th>
                                                <th className="p-4 text-right">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {readyOrders.map(o => (
                                                <tr key={o.id} className={`border-b border-[#1a1a1a]/50 transition-colors ${selectedForRetiro.includes(o.id) ? "bg-[#00CFFF]/3" : "hover:bg-white/2"}`}>
                                                    <td className="p-4">
                                                        <input type="checkbox"
                                                            checked={selectedForRetiro.includes(o.id)}
                                                            onChange={e => setSelectedForRetiro(p => e.target.checked ? [...p, o.id] : p.filter(x => x !== o.id))}
                                                            className="w-4 h-4 rounded accent-[#00CFFF]" />
                                                    </td>
                                                    <td className="p-4">
                                                        <button onClick={() => setSelectedOrder(o)} className="font-mono text-[#00CFFF] font-bold text-sm hover:underline">
                                                            {o.order_number}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-xs text-white/60">{o.description ?? o.items?.[0]?.product ?? "—"}</td>
                                                    <td className="p-4"><StatusBadge status={o.status} /></td>
                                                    <td className="p-4 text-xs text-white/40 text-right">{new Date(o.created_at).toLocaleDateString("es-UY")}</td>
                                                    <td className="p-4 text-sm font-bold text-[#00CFFF] text-right">{formatAmt(o.total_amount ?? o.total, o.currency)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-6 py-4 border-t border-[#1a1a1a] flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-white/30">{selectedForRetiro.length} órdenes seleccionadas</p>
                                            <p className="text-[10px] text-white/20 uppercase tracking-wider mt-1">Total</p>
                                            <p className="text-2xl font-black text-white">$ {retiroTotal.toFixed(2)}</p>
                                        </div>
                                        <button onClick={() => setShowRetiroModal(true)} disabled={selectedForRetiro.length === 0}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00CFFF] text-black font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00CFFF]/90 transition-colors">
                                            <ChevronRight size={16} /> Crear Retiro
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {activeSection === "retiro" && selectedOrder && <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />}

                    {/* ── PAGOS PENDIENTES ── */}
                    {activeSection === "pagos" && !selectedOrder && (
                        <>
                            <div className="flex items-center gap-3">
                                <CreditCard size={20} className="text-[#E91E8C]" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Pagos <span className="text-[#E91E8C]">Pendientes</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Órdenes que requieren comprobante de pago.</p>
                                </div>
                            </div>
                            {pendingOrders.length === 0 ? (
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-12 text-center">
                                    <Check size={40} className="mx-auto text-emerald-400/20 mb-3" />
                                    <p className="text-sm text-white/30">No tenés pagos pendientes. ¡Todo al día!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingOrders.map(o => (
                                        <div key={o.id} className="bg-[#0d0d0d] border border-orange-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-black font-mono text-[#00CFFF]">{o.order_number}</p>
                                                <p className="text-xs text-white/40 mt-0.5">{new Date(o.created_at).toLocaleDateString("es-UY")}</p>
                                            </div>
                                            <StatusBadge status={o.status} />
                                            <p className="text-lg font-black text-white">{formatAmt(o.total_amount ?? o.total, o.currency)}</p>
                                            <button onClick={() => setSelectedOrder(o)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-colors">
                                                <Upload size={12} /> Subir comprobante
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {activeSection === "pagos" && selectedOrder && <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />}

                    {/* ── HISTORIAL ── */}
                    {activeSection === "historial" && (
                        <>
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-white/50" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Historial de <span className="text-[#00CFFF]">Pedidos y Retiros</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Registro completo de actividad.</p>
                                </div>
                            </div>

                            {retiros.length > 0 && (
                                <>
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Mis Retiros</p>
                                    <div className="space-y-2">
                                        {retiros.map(r => (
                                            <div key={r.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                                                <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/2 transition-colors"
                                                    onClick={() => setExpandedRetiro(expandedRetiro === r.id ? null : r.id)}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="text-sm font-black text-[#00CFFF] font-mono">{r.retiro_number}</span>
                                                            <RetiroStatusBadge status={r.status} />
                                                        </div>
                                                        <p className="text-xs text-white/30">{r.order_ids?.length ?? 0} orden(es) — {r.tipo === "retiro" ? "Retiro en local" : "Envio"}</p>
                                                    </div>
                                                    <p className="text-xs text-white/40">{new Date(r.created_at).toLocaleDateString("es-UY")}</p>
                                                    <ChevronDown size={16} className={`text-white/30 transition-transform ${expandedRetiro === r.id ? "rotate-180" : ""}`} />
                                                </button>
                                                {expandedRetiro === r.id && (
                                                    <div className="border-t border-[#1a1a1a] p-4 space-y-1 text-xs text-white/40">
                                                        {r.shipping_type_name && <p>Envio: <span className="text-white/60">{r.shipping_type_name}</span></p>}
                                                        {r.agency_name && <p>Agencia: <span className="text-white/60">{r.agency_name}</span></p>}
                                                        {r.bus_company && <p>Empresa: <span className="text-white/60">{r.bus_company}</span></p>}
                                                        {r.direccion && <p>Dirección: <span className="text-white/60">{r.direccion}</span></p>}
                                                        {r.horario && <p>Horario: <span className="text-white/60">{r.horario}</span></p>}
                                                        {r.receptor && <p>Recibe: <span className="text-white/60">{r.receptor}</span></p>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <p className="text-xs font-bold text-white/30 uppercase tracking-wider mt-2">Todos mis Pedidos</p>
                            {orders.length === 0 ? (
                                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-12 text-center">
                                    <Clock size={40} className="mx-auto text-white/10 mb-3" />
                                    <p className="text-sm text-white/30">No tenés pedidos registrados aún.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {orders.map(o => (
                                        <div key={o.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                                            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/2 transition-colors"
                                                onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-sm font-black text-[#00CFFF] font-mono">{o.order_number}</span>
                                                        <StatusBadge status={o.status} />
                                                    </div>
                                                    <p className="text-xs text-white/30">{o.description ?? o.items?.[0]?.product ?? ""}</p>
                                                </div>
                                                <p className="text-sm font-bold text-white">{formatAmt(o.total_amount ?? o.total, o.currency)}</p>
                                                <p className="text-xs text-white/40">{new Date(o.created_at).toLocaleDateString("es-UY")}</p>
                                                <ChevronDown size={16} className={`text-white/30 transition-transform ${expandedOrder === o.id ? "rotate-180" : ""}`} />
                                            </button>
                                            {expandedOrder === o.id && (
                                                <div className="border-t border-[#1a1a1a] p-4">
                                                    <button onClick={() => setSelectedOrder(o)} className="flex items-center gap-1.5 text-xs text-[#00CFFF] hover:opacity-70">
                                                        <Eye size={12} /> Ver detalle <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {activeSection === "historial" && selectedOrder && <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />}

                    {/* ── SOPORTE ── */}
                    {activeSection === "soporte" && (
                        <>
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-[#00CFFF]" />
                                <div>
                                    <p className="text-sm font-bold text-white/80">Soporte / <span className="text-[#00CFFF]">Ayuda</span></p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Centro de consultas y reclamos.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <a href="https://wa.me/59899999999" target="_blank" rel="noopener noreferrer"
                                    className="bg-[#0d0d0d] border border-[#25D366]/20 rounded-2xl p-6 hover:bg-[#25D366]/5 transition-colors group">
                                    <p className="text-2xl mb-3">💬</p>
                                    <p className="text-sm font-bold text-white">WhatsApp</p>
                                    <p className="text-xs text-white/40 mt-1">Atención rápida por mensajería</p>
                                    <p className="text-xs text-[#25D366] mt-3 group-hover:underline">Abrir chat →</p>
                                </a>
                                <a href="mailto:info@publideas.com.uy"
                                    className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-6 hover:bg-white/3 transition-colors group">
                                    <p className="text-2xl mb-3">📧</p>
                                    <p className="text-sm font-bold text-white">Email</p>
                                    <p className="text-xs text-white/40 mt-1">Consultas y reclamos por correo</p>
                                    <p className="text-xs text-[#00CFFF] mt-3 group-hover:underline">Enviar email →</p>
                                </a>
                                <div className="col-span-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-6">
                                    <p className="text-sm font-bold text-white mb-2">Hacer un pedido nuevo</p>
                                    <p className="text-xs text-white/40 mb-4">Iniciá un nuevo trabajo directamente desde el catálogo.</p>
                                    <Link href="/pedido" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/90 transition-colors">
                                        <Package size={14} /> Ver catálogo de servicios
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </main>

            {/* ── Retiro Modal ── */}
            {showRetiroModal && (
                <RetiroModal
                    selectedOrders={selectedForRetiro}
                    orders={orders}
                    shippingTypes={shippingTypes}
                    agencies={agencies}
                    clientId={session.client_id}
                    onClose={() => setShowRetiroModal(false)}
                    onCreated={r => {
                        setShowRetiroModal(false);
                        setSelectedForRetiro([]);
                        setRetiroSuccess(r.retiro_number);
                        fetch(`/api/retiros?client_id=${session.client_id}`)
                            .then(res => res.json())
                            .then((d: Retiro[]) => setRetiros(Array.isArray(d) ? d : []));
                    }}
                />
            )}
        </div>
    );
}
