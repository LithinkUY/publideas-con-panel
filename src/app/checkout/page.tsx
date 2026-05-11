"use client";
import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart, CreditCard, Building2, Banknote, ArrowLeft,
    Check, Loader2, AlertCircle, Printer, User, Send,
} from "lucide-react";
import Link from "next/link";

interface CartItem {
    service: string;
    product: string;
    productId: string;
    serviceSlug: string;
    quantity: number;
    width?: number;
    height?: number;
    m2?: number;
    variants: string[];
    notes?: string;
    basePrice: number;
    total: number;
    currency: string;
    uyu_rate?: number;
}

interface Gateway {
    id: number;
    name: string;
    type: string;
    description: string;
    config: Record<string, string>;
    active: boolean;
    test_mode: boolean;
    sort_order: number;
}

interface OrderResult {
    order_id: number;
    order_number: string;
    client_id: number;
    client_code: string;
    pin_code: string;
    client_name: string;
    is_new_client: boolean;
}

const GATEWAY_ICONS: Record<string, React.ReactNode> = {
    mercadopago: <CreditCard size={20} className="text-sky-400" />,
    bank_transfer: <Building2 size={20} className="text-emerald-400" />,
    cash: <Banknote size={20} className="text-amber-400" />,
};
const GATEWAY_COLORS: Record<string, string> = {
    mercadopago: "border-sky-500/30 hover:border-sky-400/50",
    bank_transfer: "border-emerald-500/30 hover:border-emerald-400/50",
    cash: "border-amber-500/30 hover:border-amber-400/50",
};
const GATEWAY_BADGE: Record<string, string> = {
    mercadopago: "bg-sky-400/10 text-sky-400",
    bank_transfer: "bg-emerald-400/10 text-emerald-400",
    cash: "bg-amber-400/10 text-amber-400",
};

function formatAmount(total: number, currency: string, uyu_rate = 43) {
    if (currency === "UYU") {
        const uyu = total * uyu_rate;
        return `$${uyu.toLocaleString("es-UY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `US$ ${Number(total).toFixed(2)}`;
}

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItem | null>(null);
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
    const [existingSession, setExistingSession] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("checkout_cart");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed.variants)) parsed.variants = [];
            setCart(parsed);
        }
        // Pre-fill from portal session if already logged in
        try {
            const sessionRaw = localStorage.getItem("portal_session");
            if (sessionRaw) {
                const s = JSON.parse(sessionRaw);
                if (s?.email) {
                    setName(s.name ?? "");
                    setEmail(s.email ?? "");
                    setExistingSession(true);
                }
            }
        } catch { /* ignore */ }
        fetch("/api/payment-gateways")
            .then(r => r.json())
            .then((rows: Gateway[]) => {
                const active = rows.filter(g => g.active).sort((a, b) => a.sort_order - b.sort_order);
                setGateways(active);
                if (active.length === 1) setSelectedGateway(active[0]);
            })
            .catch(() => { });
    }, []);

    const handlePay = async () => {
        if (!cart || !selectedGateway) return;
        setLoading(true);
        setError("");
        try {
            const completeRes = await fetch("/api/checkout/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, email, phone, cart,
                    gateway_id: selectedGateway.id,
                    gateway_type: selectedGateway.type,
                }),
            });
            const completeData = await completeRes.json();
            if (!completeRes.ok) throw new Error(completeData.error ?? "Error creando el pedido");

            // Save session regardless of payment method
            localStorage.setItem("portal_session", JSON.stringify({
                client_id: completeData.client_id,
                client_code: completeData.client_code,
                name: completeData.client_name,
                email,
                pin_code: completeData.pin_code,
            }));
            sessionStorage.removeItem("checkout_cart");

            if (selectedGateway.type === "mercadopago") {
                // For MercadoPago: get preference and redirect — don't show success screen yet
                const mpRes = await fetch("/api/payment-gateways/mercadopago/preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: [{
                            id: cart.productId,
                            title: `${cart.service} - ${cart.product}`,
                            quantity: cart.quantity,
                            unit_price: Number((cart.total / cart.quantity).toFixed(2)),
                            currency_id: cart.currency === "UYU" ? "UYU" : "USD",
                        }],
                        payer: { name, email },
                        external_reference: completeData.order_number,
                        back_urls: {
                            success: `${window.location.origin}/checkout/success`,
                            failure: `${window.location.origin}/checkout/failure`,
                            pending: `${window.location.origin}/checkout/success`,
                        },
                    }),
                });
                const mpData = await mpRes.json();
                if (!mpRes.ok || !mpData.init_point) {
                    throw new Error(mpData.error ?? "No se pudo crear la preferencia de MercadoPago");
                }
                // Redirect to MercadoPago checkout
                window.location.href = mpData.init_point;
                return;
            }

            // For other gateways: show success screen directly
            setOrderResult(completeData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al procesar");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const buildWhatsappMsg = (order: OrderResult) => {
        const lines = [
            `🧾 *COMPROBANTE DE PEDIDO*`,
            `Orden: *${order.order_number}*`,
            `Cliente: ${order.client_name}`,
            `Email: ${email}`,
            `Producto: ${cart?.product}`,
            `Total: ${cart ? formatAmount(cart.total, cart.currency, cart.uyu_rate) : ""}`,
            `Método de pago: ${selectedGateway?.name}`,
            ``,
            `_Enviado desde el portal de pedidos_`,
        ];
        return encodeURIComponent(lines.join("\n"));
    };

    // ── Empty cart ──────────────────────────────────────────────
    if (!cart) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <ShoppingCart size={48} className="mx-auto text-white/20" />
                    <p className="text-white/40">No hay nada en el carrito.</p>
                    <Link href="/" className="inline-block px-6 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white/60 text-sm hover:text-white">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    // ── Success screen ──────────────────────────────────────────
    if (orderResult) {
        const isBank = selectedGateway?.type === "bank_transfer";
        const isCash = selectedGateway?.type === "cash";
        const bankCfg = selectedGateway?.config ?? {};
        const amtStr = formatAmount(cart.total, cart.currency, cart.uyu_rate);

        return (
            <>
                <style>{`@media print { .no-print { display:none!important; } body { background:#fff!important; color:#000!important; } .print-card { background:#fff!important; border:1px solid #ccc!important; color:#000!important; } }`}</style>

                <div className="min-h-screen bg-[#080808] py-10 px-4">
                    <div className="max-w-lg mx-auto space-y-5" ref={printRef}>

                        {/* Success banner */}
                        <div className="print-card bg-[#0d0d0d] border border-green-500/20 rounded-2xl p-6 text-center space-y-2">
                            <div className="w-14 h-14 rounded-full bg-green-400/20 flex items-center justify-center mx-auto mb-3">
                                <Check size={28} className="text-green-400" />
                            </div>
                            <h1 className="text-xl font-black text-white">¡Pedido recibido!</h1>
                            <p className="text-sm text-white/50">Tu pedido fue registrado exitosamente</p>
                        </div>

                        {/* Order details */}
                        <div className="print-card bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Detalle del pedido</p>
                            <div className="flex justify-between">
                                <span className="text-xs text-white/50">N° de orden</span>
                                <span className="text-sm font-black text-[#00CFFF] font-mono">{orderResult.order_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-white/50">Producto</span>
                                <span className="text-sm text-white font-semibold">{cart.product}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-white/50">Servicio</span>
                                <span className="text-xs text-white/60">{cart.service}</span>
                            </div>
                            {(cart.variants?.length ?? 0) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-xs text-white/50">Variantes</span>
                                    <span className="text-xs text-white/70">{cart.variants.join(", ")}</span>
                                </div>
                            )}
                            {cart.m2 && (
                                <div className="flex justify-between">
                                    <span className="text-xs text-white/50">Medidas</span>
                                    <span className="text-xs text-white/70">{cart.width}m × {cart.height}m = {Number(cart.m2).toFixed(2)}m²</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-xs text-white/50">Cantidad</span>
                                <span className="text-xs text-white/70">×{cart.quantity}</span>
                            </div>
                            <div className="border-t border-[#2a2a2a] pt-2 flex justify-between">
                                <span className="text-sm font-bold text-white">Total</span>
                                <span className="text-xl font-black text-[#00CFFF]">{amtStr}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-white/50">Método de pago</span>
                                <span className="text-xs text-white/70">{selectedGateway?.name}</span>
                            </div>
                        </div>

                        {/* Bank transfer info */}
                        {isBank && (
                            <div className="print-card bg-[#0d0d0d] border border-emerald-500/20 rounded-2xl p-5 space-y-2">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Datos para la transferencia</p>
                                {bankCfg.bank_name && <div className="flex justify-between"><span className="text-xs text-white/50">Banco</span><span className="text-xs text-white">{bankCfg.bank_name}</span></div>}
                                {bankCfg.account_holder && <div className="flex justify-between"><span className="text-xs text-white/50">Titular</span><span className="text-xs text-white">{bankCfg.account_holder}</span></div>}
                                {bankCfg.account_number && <div className="flex justify-between"><span className="text-xs text-white/50">CBU/Alias</span><span className="text-xs text-white font-mono">{bankCfg.account_number}</span></div>}
                                {bankCfg.instructions && <p className="text-xs text-white/40 mt-2 pt-2 border-t border-[#2a2a2a]">{bankCfg.instructions}</p>}
                                <div className="mt-3 bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-3 text-center">
                                    <p className="text-xs text-emerald-400/80">Monto a transferir: <strong className="text-emerald-400">{amtStr}</strong></p>
                                </div>
                            </div>
                        )}

                        {/* Cash info */}
                        {isCash && (
                            <div className="print-card bg-amber-400/5 border border-amber-400/20 rounded-2xl p-5">
                                <p className="text-sm text-amber-400/80">{selectedGateway?.config?.instructions ?? "Pagá en efectivo al retirar tu pedido."}</p>
                            </div>
                        )}

                        {/* Credentials — only show to new clients or if not already logged in */}
                        {(orderResult.is_new_client || !existingSession) && (
                            <div className="print-card bg-[#0d0d0d] border border-[#00CFFF]/20 rounded-2xl p-5 space-y-3">
                                <p className="text-xs font-bold text-[#00CFFF]/70 uppercase tracking-wider">Tu acceso al panel de cliente</p>
                                <div className="flex justify-between">
                                    <span className="text-xs text-white/50">Email</span>
                                    <span className="text-xs text-white font-mono">{email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-white/50">PIN de acceso</span>
                                    <span className="text-lg font-black text-[#00CFFF] font-mono tracking-widest">{orderResult.pin_code}</span>
                                </div>
                                {orderResult.is_new_client && (
                                    <p className="text-[10px] text-white/30">⚠️ Guardá tu PIN — lo necesitás para ingresar al panel de cliente</p>
                                )}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="no-print space-y-3">
                            <Link href="/portal"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00CFFF] text-black font-black text-sm hover:bg-[#00CFFF]/90 transition-colors">
                                <User size={18} /> Ir a mi panel de cliente
                            </Link>

                            {isBank && <UploadReceipt orderId={orderResult.order_id} />}

                            <a
                                href={`https://wa.me/?text=${buildWhatsappMsg(orderResult)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-colors"
                            >
                                <Send size={16} /> Enviar comprobante por WhatsApp
                            </a>

                            <button onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white/60 font-semibold text-sm hover:text-white transition-colors">
                                <Printer size={16} /> Imprimir / Guardar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Checkout form ───────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#080808] py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <button onClick={() => window.history.back()} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
                    <ArrowLeft size={16} /> Volver
                </button>

                <h1 className="text-2xl font-black uppercase text-white">
                    CHECK<span className="text-[#00CFFF]">OUT</span>
                </h1>

                {/* Order summary */}
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Resumen del pedido</p>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white">{cart.product}</p>
                            <p className="text-xs text-white/40">{cart.service}</p>
                            {(cart.variants?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {(cart.variants ?? []).map((v, i) => (
                                        <span key={i} className="text-[10px] bg-[#2a2a2a] text-white/50 px-2 py-0.5 rounded-full">{v}</span>
                                    ))}
                                </div>
                            )}
                            {cart.m2 && <p className="text-xs text-white/40 mt-1">{cart.width}m × {cart.height}m = {Number(cart.m2).toFixed(2)}m²</p>}
                            {cart.notes && <p className="text-[11px] text-white/30 mt-1">&quot;{cart.notes}&quot;</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs text-white/30">×{cart.quantity}</p>
                            <p className="text-xl font-black text-[#00CFFF]">
                                {formatAmount(cart.total, cart.currency, cart.uyu_rate)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact info */}
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Tus datos</p>
                        {existingSession && (
                            <span className="text-[10px] bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 px-2 py-0.5 rounded-full font-semibold">Sesión activa</span>
                        )}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Nombre completo *</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            readOnly={existingSession}
                            className={`w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/50 ${existingSession ? "opacity-60 cursor-not-allowed" : ""}`}
                            placeholder="Tu nombre completo" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Email *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                readOnly={existingSession}
                                className={`w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/50 ${existingSession ? "opacity-60 cursor-not-allowed" : ""}`}
                                placeholder="tu@email.com" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Teléfono</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/50"
                                placeholder="+598 ..." />
                        </div>
                    </div>
                </div>

                {/* Payment methods */}
                {gateways.length > 0 && (
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Método de pago</p>
                        <div className="space-y-2">
                            {gateways.map(gw => {
                                const isSel = selectedGateway?.id === gw.id;
                                return (
                                    <button key={gw.id} onClick={() => setSelectedGateway(gw)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${isSel ? "border-[#00CFFF]/50 bg-[#00CFFF]/5" : `border-[#2a2a2a] bg-[#1a1a1a] ${GATEWAY_COLORS[gw.type] ?? "hover:border-white/20"}`}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${GATEWAY_BADGE[gw.type] ?? "bg-white/10 text-white"}`}>
                                            {GATEWAY_ICONS[gw.type] ?? <CreditCard size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white">{gw.name}</p>
                                            {gw.description && <p className="text-xs text-white/40 mt-0.5">{gw.description}</p>}
                                            {gw.test_mode && <span className="mt-1 inline-block text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">MODO PRUEBA</span>}
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "border-[#00CFFF] bg-[#00CFFF]" : "border-[#3a3a3a]"}`}>
                                            {isSel && <Check size={10} className="text-black" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedGateway?.type === "bank_transfer" && (
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-sm text-white/60 space-y-1">
                                <p className="text-xs font-bold text-white/40 mb-2">Datos para transferencia</p>
                                {selectedGateway.config.bank_name && <p>🏦 {selectedGateway.config.bank_name}</p>}
                                {selectedGateway.config.account_holder && <p>👤 {selectedGateway.config.account_holder}</p>}
                                {selectedGateway.config.account_number && <p className="font-mono">📋 {selectedGateway.config.account_number}</p>}
                            </div>
                        )}
                        {selectedGateway?.type === "cash" && (
                            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                                <p className="text-sm text-amber-400/80">{selectedGateway.config.instructions ?? "Pagá en efectivo al retirar."}</p>
                            </div>
                        )}
                    </div>
                )}

                {gateways.length === 0 && (
                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
                        <p className="text-sm text-yellow-400/80">No hay métodos de pago disponibles. Contactanos directamente.</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                <button onClick={handlePay} disabled={loading || !selectedGateway || !name || !email}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#00CFFF] text-black font-black text-base hover:bg-[#00CFFF]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {loading
                        ? <><Loader2 size={20} className="animate-spin" /> Procesando...</>
                        : selectedGateway?.type === "mercadopago"
                            ? <><CreditCard size={20} /> Pagar con MercadoPago</>
                            : selectedGateway?.type === "bank_transfer"
                                ? <><Building2 size={20} /> Confirmar pedido (Transferencia)</>
                                : selectedGateway?.type === "cash"
                                    ? <><Banknote size={20} /> Confirmar pedido (Efectivo)</>
                                    : <><ShoppingCart size={20} /> Confirmar pedido</>
                    }
                </button>
                <p className="text-center text-xs text-white/20">Al confirmar aceptás nuestros términos y condiciones.</p>
            </div>
        </div>
    );
}

// ── Upload receipt sub-component ────────────────────────────
function UploadReceipt({ orderId }: { orderId: number }) {
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState("");

    const handleFile = (file: File) => {
        setUploading(true);
        setErr("");
        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const file_data = e.target?.result as string;
                const res = await fetch(`/api/orders/${orderId}/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file_name: file.name, file_data, file_type: file.type, uploaded_by: "client" }),
                });
                if (!res.ok) throw new Error("Error al subir");
                setDone(true);
            } catch {
                setErr("No se pudo subir el archivo");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (done) return (
        <div className="flex items-center gap-2 p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-sm text-emerald-400">
            <Check size={16} /> Comprobante enviado correctamente
        </div>
    );

    return (
        <label className="cursor-pointer block">
            <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed text-sm font-semibold transition-colors ${uploading ? "border-white/20 text-white/30" : "border-emerald-500/40 text-emerald-400 hover:border-emerald-400/70 hover:bg-emerald-400/5"}`}>
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Subiendo...</> : <>📎 Adjuntar comprobante de transferencia</>}
            </div>
            {err && <p className="text-xs text-red-400 mt-1 text-center">{err}</p>}
            <input type="file" className="hidden" accept="image/*,.pdf"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                disabled={uploading} />
        </label>
    );
}
