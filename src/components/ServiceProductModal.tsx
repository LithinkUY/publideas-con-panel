"use client";
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ArrowRight, Upload, Ruler, Calculator, ShoppingCart, Check } from "lucide-react";
import { Service, ServiceProduct, Variant, PricingConfig, defaultPricingConfig } from "@/lib/types";
import { calcTotal, variantPriceLabel, formatBoth } from "@/lib/pricing";
import { useRouter } from "next/navigation";

interface Props {
    service: Service | null;
    onClose: () => void;
}

export default function ServiceProductModal({ service, onClose }: Props) {
    const router = useRouter();
    const [step, setStep] = useState<"products" | "configure">("products");
    const [selected, setSelected] = useState<ServiceProduct | null>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [pricing, setPricing] = useState<PricingConfig>(defaultPricingConfig);

    // Fix: reset state and close when service becomes null
    useEffect(() => {
        if (!service) {
            setStep("products");
            setSelected(null);
            setSelectedVariants([]);
            setQuantity(1);
            setWidth("");
            setHeight("");
            setNotes("");
            setFile(null);
        } else {
            setStep("products");
            setSelected(null);
        }
    }, [service]);

    // Load pricing config
    useEffect(() => {
        fetch("/api/pricing")
            .then(r => r.json())
            .then(data => { if (data?.currency) setPricing(data); })
            .catch(() => { });
    }, []);

    // Load variants when product is selected
    useEffect(() => {
        if (!selected) return;
        setSelectedVariants([]);
        if (!selected.variant_ids?.length) { setVariants([]); return; }
        fetch("/api/variants")
            .then(r => r.json())
            .then((all: Variant[]) => {
                // Coerce both sides to Number to avoid string/number mismatch
                const ids = (selected.variant_ids ?? []).map(Number);
                setVariants(all.filter(v => v.active && ids.includes(Number(v.id))));
            })
            .catch(() => setVariants([]));
    }, [selected]);

    const closeModal = useCallback(() => onClose(), [onClose]);

    if (!service) return null;

    const activeProducts = (service.products ?? [])
        .filter(p => p.active)
        .sort((a, b) => (a.sort_order ?? a.order ?? 0) - (b.sort_order ?? b.order ?? 0));

    const toggleVariant = (id: number) =>
        setSelectedVariants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const chosenVariants = variants.filter(v => selectedVariants.includes(v.id));
    const basePrice = selected?.price ?? 0;
    const m2 = selected?.calculator_enabled && width && height
        ? parseFloat(width) * parseFloat(height) : undefined;
    const areaAdjustedPrice = m2 != null ? basePrice * m2 : basePrice;
    const total = calcTotal(basePrice, chosenVariants, quantity, m2);

    const handleCotizar = () => {
        const cart = {
            service: service.name,
            product: selected?.name,
            productId: selected?.id,
            serviceSlug: selected?.service_slug ?? String(service.id),
            quantity,
            width: width || undefined,
            height: height || undefined,
            m2,
            variants: chosenVariants.map(v => v.name),
            notes,
            basePrice,
            total,
            currency: pricing.currency,   // use actual selected currency
            uyu_rate: pricing.uyu_rate,
        };
        sessionStorage.setItem("checkout_cart", JSON.stringify(cart));
        router.push("/checkout");
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
            <div className="w-full max-w-lg bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a1a] flex-shrink-0">
                    {step === "configure" && (
                        <button onClick={() => setStep("products")} className="text-white/40 hover:text-white mr-1 flex-shrink-0">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ background: service.image_url ? `url(${service.image_url}) center/cover` : service.color }}
                    />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-white truncate">{service.name}</h2>
                        <p className="text-[11px] text-white/40">
                            {step === "products" ? "SeleccionÃ¡ un producto para cotizar" : `Configurar: ${selected?.name}`}
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-white/30 hover:text-white flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">

                    {/* STEP 1: Product list */}
                    {step === "products" && (
                        <div className="p-4 space-y-3">
                            {activeProducts.length === 0 ? (
                                <p className="text-center text-white/30 text-sm py-10">No hay productos disponibles aÃºn.</p>
                            ) : activeProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelected(p); setStep("configure"); }}
                                    className="w-full flex gap-4 p-4 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#00CFFF]/30 rounded-xl text-left transition-all group"
                                >
                                    {p.image_url
                                        ? <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                        : <div className="w-14 h-14 rounded-lg bg-[#111] flex-shrink-0 flex items-center justify-center text-2xl">ðŸ–¨ï¸</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white group-hover:text-[#00CFFF] transition-colors">{p.name}</p>
                                        {p.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{p.description}</p>}
                                        {p.calculator_enabled && (
                                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                                                <Calculator size={9} /> Calculadora mÂ²
                                            </span>
                                        )}
                                        {(p.details ?? []).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {p.details!.slice(0, 3).map((d, i) => (
                                                    <span key={i} className="text-[10px] bg-[#2a2a2a] text-white/50 px-2 py-0.5 rounded-full">{d.label}: {d.value}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                                        {p.price_visible !== false && p.price && (
                                            <div className="text-right">
                                                <span className="text-[10px] text-white/30">desde</span>
                                                <p className="text-sm font-bold text-[#00CFFF]">{formatBoth(p.price, pricing)}</p>
                                                {p.unit && <p className="text-[10px] text-white/30">/ {p.unit}</p>}
                                            </div>
                                        )}
                                        <ArrowRight size={16} className="text-white/20 group-hover:text-[#00CFFF] transition-colors mt-auto" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Configure */}
                    {step === "configure" && selected && (
                        <div className="p-5 space-y-5">
                            {/* Product summary */}
                            <div className="bg-[#1a1a1a] rounded-xl p-3 flex gap-3 border border-[#2a2a2a]">
                                {selected.image_url && <img src={selected.image_url} alt={selected.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                                <div>
                                    <p className="text-sm font-semibold text-white">{selected.name}</p>
                                    {selected.price_visible !== false && selected.price && (
                                        <p className="text-xs text-[#00CFFF]">{formatBoth(selected.price, pricing)} / {selected.unit ?? "unidad"}</p>
                                    )}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="label-xs">CANTIDAD</label>
                                <input type="number" min="1" value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="dark-input w-32 text-xl font-bold text-center" />
                            </div>

                            {/* Calculator mÂ² */}
                            {selected.calculator_enabled && (
                                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-semibold text-amber-400/80 flex items-center gap-2">
                                        <Calculator size={13} /> CALCULADORA DE METROS CUADRADOS
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label-xs flex items-center gap-1"><Ruler size={10} /> ANCHO (m)</label>
                                            <input type="number" step="0.01" min="0" value={width} onChange={e => setWidth(e.target.value)} className="dark-input" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="label-xs flex items-center gap-1"><Ruler size={10} /> ALTO (m)</label>
                                            <input type="number" step="0.01" min="0" value={height} onChange={e => setHeight(e.target.value)} className="dark-input" placeholder="0.00" />
                                        </div>
                                    </div>
                                    {width && height && (
                                        <p className="text-[11px] text-amber-400/60">
                                            {parseFloat(width).toFixed(2)} Ã— {parseFloat(height).toFixed(2)} = <strong className="text-amber-400">{m2?.toFixed(2)} mÂ²</strong>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Variants */}
                            {variants.length > 0 && (
                                <div>
                                    <label className="label-xs mb-2 block">OPCIONES / VARIANTES</label>
                                    <div className="space-y-2">
                                        {variants.map(v => {
                                            const checked = selectedVariants.includes(v.id);
                                            return (
                                                <button key={v.id} type="button" onClick={() => toggleVariant(v.id)}
                                                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${checked ? "border-[#00CFFF]/50 bg-[#00CFFF]/5" : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? "bg-[#00CFFF]" : "border border-[#3a3a3a]"}`}>
                                                            {checked && <Check size={10} className="text-black" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-white">{v.name}</p>
                                                            {v.description && <p className="text-[10px] text-white/40">{v.description}</p>}
                                                        </div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-[#00CFFF] flex-shrink-0">
                                                        {variantPriceLabel(v, areaAdjustedPrice, pricing)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="label-xs">NOTAS / DETALLES ADICIONALES</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="dark-input resize-none" placeholder="Color, terminaciÃ³n, arte propio, etc." />
                            </div>

                            {/* File */}
                            <label className="cursor-pointer block">
                                <div className="flex items-center gap-3 p-3 border border-dashed border-[#3a3a3a] hover:border-[#00CFFF]/50 rounded-xl transition-colors">
                                    <Upload size={16} className="text-white/30" />
                                    <div>
                                        <p className="text-xs text-white/50 font-semibold">{file ? file.name : "Adjuntar archivo (arte, referencia)"}</p>
                                        <p className="text-[10px] text-white/20">PDF, AI, PSD, PNG, JPG hasta 20MB</p>
                                    </div>
                                </div>
                                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                            </label>

                            {/* Price summary */}
                            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-white/40">Precio base</span>
                                    <span className="text-xs text-white/60">{formatBoth(basePrice * (m2 ?? 1) * quantity, pricing)}</span>
                                </div>
                                {chosenVariants.map(v => (
                                    <div key={v.id} className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-white/40">+ {v.name}</span>
                                        <span className="text-xs text-[#00CFFF]/80">{variantPriceLabel(v, areaAdjustedPrice, pricing)}</span>
                                    </div>
                                ))}
                                <div className="border-t border-[#2a2a2a] mt-2 pt-2 flex justify-between items-center">
                                    <span className="text-sm font-bold text-white">TOTAL ESTIMADO</span>
                                    <span className="text-lg font-black text-[#00CFFF]">{formatBoth(total, pricing)}</span>
                                </div>
                                {selected.calculator_enabled && (!width || !height) && (
                                    <p className="text-[10px] text-white/30 mt-1">* IngresÃ¡ las medidas para calcular el total exacto</p>
                                )}
                            </div>

                            <button
                                onClick={handleCotizar}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/90 transition-colors"
                            >
                                <ShoppingCart size={16} /> Ir al Checkout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
