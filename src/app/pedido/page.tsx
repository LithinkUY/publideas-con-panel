"use client";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, SlidersHorizontal, X, ShoppingCart, Tag, Ruler } from "lucide-react";

interface Product {
    id: number;
    service_slug: string;
    service_name: string;
    service_color: string;
    name: string;
    description: string;
    price?: number;
    price_per_m2?: number;
    unit?: string;
    image_url?: string;
    price_visible: boolean;
    calculator_enabled: boolean;
    active: boolean;
}

interface ServiceRaw {
    id: number;
    slug: string;
    name: string;
    color: string;
    active: boolean;
    products: {
        id: number;
        service_slug: string;
        name: string;
        description: string;
        price?: number;
        price_per_m2?: number;
        unit?: string;
        image_url?: string;
        price_visible: boolean;
        calculator_enabled: boolean;
        active: boolean;
    }[];
}

export default function PedidoPage() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [calcProduct, setCalcProduct] = useState<Product | null>(null);
    const [calcWidth, setCalcWidth] = useState("");
    const [calcHeight, setCalcHeight] = useState("");

    useEffect(() => {
        fetch("/api/services")
            .then(r => r.json())
            .then((services: ServiceRaw[]) => {
                const products: Product[] = [];
                for (const s of services) {
                    if (!s.active) continue;
                    for (const p of s.products ?? []) {
                        if (!p.active) continue;
                        products.push({
                            ...p,
                            service_slug: s.slug,
                            service_name: s.name,
                            service_color: s.color ?? "#1a2a3a",
                            price_per_m2: p.price_per_m2 != null ? Number(p.price_per_m2) : undefined,
                        });
                    }
                }
                setAllProducts(products);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const categories = useMemo(() => {
        const seen = new Map<string, string>();
        for (const p of allProducts) seen.set(p.service_slug, p.service_name);
        return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
    }, [allProducts]);

    const filtered = useMemo(() => {
        return allProducts.filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase()) ||
                p.service_name.toLowerCase().includes(search.toLowerCase());
            const matchCat = selectedCategory === "all" || p.service_slug === selectedCategory;
            const min = priceMin ? Number(priceMin) : null;
            const max = priceMax ? Number(priceMax) : null;
            const matchPrice = (!min || (p.price ?? 0) >= min) && (!max || (p.price ?? 0) <= max);
            return matchSearch && matchCat && matchPrice;
        });
    }, [allProducts, search, selectedCategory, priceMin, priceMax]);

    const goToCheckout = (p: Product, w?: number, h?: number) => {
        const m2 = w && h ? parseFloat((w * h).toFixed(4)) : undefined;
        const pricePerM2 = p.price_per_m2 ?? p.price ?? 0;
        const total = m2 ? pricePerM2 * m2 : (p.price ?? 0);
        const cartItem = {
            service: p.service_name,
            product: p.name,
            productId: String(p.id),
            serviceSlug: p.service_slug,
            quantity: 1,
            width: w,
            height: h,
            m2,
            variants: [] as string[],
            basePrice: m2 ? pricePerM2 : (p.price ?? 0),
            total,
            currency: "USD",
        };
        sessionStorage.setItem("checkout_cart", JSON.stringify(cartItem));
        setCartCount(c => c + 1);
        window.location.href = "/checkout";
    };

    const handleQuote = (p: Product) => {
        if (p.calculator_enabled) {
            setCalcWidth("");
            setCalcHeight("");
            setCalcProduct(p);
        } else {
            goToCheckout(p);
        }
    };

    // m2 calculator derived values
    const calcW = parseFloat(calcWidth) || 0;
    const calcH = parseFloat(calcHeight) || 0;
    const calcM2 = calcW > 0 && calcH > 0 ? calcW * calcH : 0;
    const calcPrice = calcProduct
        ? calcM2 > 0
            ? (calcProduct.price_per_m2 ?? calcProduct.price ?? 0) * calcM2
            : null
        : null;

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("all");
        setPriceMin("");
        setPriceMax("");
    };

    const hasFilters = search || selectedCategory !== "all" || priceMin || priceMax;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            {/* ── M² Calculator Modal ── */}
            {calcProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: calcProduct.service_color + "22" }}>
                                    <Ruler size={18} style={{ color: calcProduct.service_color }} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm leading-tight">{calcProduct.name}</p>
                                    <p className="text-xs text-gray-400">{calcProduct.service_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setCalcProduct(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Calculadora de m²</p>

                        <div className="flex gap-3 mb-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1 font-medium">Ancho (metros)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={calcWidth}
                                    onChange={e => setCalcWidth(e.target.value)}
                                    placeholder="ej: 1.50"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-end pb-2 text-gray-300 font-light text-xl">×</div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1 font-medium">Alto (metros)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={calcHeight}
                                    onChange={e => setCalcHeight(e.target.value)}
                                    placeholder="ej: 2.00"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                                />
                            </div>
                        </div>

                        {/* Result */}
                        <div className={`rounded-2xl p-4 mb-4 text-center transition-all ${calcM2 > 0 ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"}`}>
                            {calcM2 > 0 ? (
                                <>
                                    <p className="text-2xl font-black text-blue-700">{calcM2.toFixed(2)} m²</p>
                                    {calcProduct.price_visible && calcPrice != null && (
                                        <p className="text-sm text-blue-500 font-semibold mt-1">
                                            US$ {calcPrice.toFixed(2)}
                                            {calcProduct.price_per_m2 && (
                                                <span className="text-xs text-blue-400 ml-1 font-normal">(US$ {calcProduct.price_per_m2}/m²)</span>
                                            )}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-400 text-sm">Ingresá ancho y alto para calcular</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setCalcProduct(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    goToCheckout(calcProduct, calcW || undefined, calcH || undefined);
                                    setCalcProduct(null);
                                }}
                                disabled={!calcM2}
                                className="flex-2 flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
                                style={{ background: calcProduct.service_color }}
                            >
                                Cotizar →
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
                {/* Top bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-gray-900">Catálogo de Productos</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {loading ? "Cargando…" : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors sm:hidden ${showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-700"}`}
                        >
                            <SlidersHorizontal size={16} /> Filtros
                        </button>
                        {cartCount > 0 && (
                            <a href="/checkout" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                                <ShoppingCart size={16} /> Ver cotización ({cartCount})
                            </a>
                        )}
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar productos, servicios…"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-6">
                    {/* Sidebar filters */}
                    <aside className={`flex-shrink-0 w-56 ${showFilters ? "block" : "hidden"} sm:block`}>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-gray-900 flex items-center gap-2"><SlidersHorizontal size={14} /> Filtros</span>
                                {hasFilters && (
                                    <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Limpiar</button>
                                )}
                            </div>

                            {/* Category filter */}
                            <div className="mb-5">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag size={11} /> Categoría</p>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory("all")}
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedCategory === "all" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        Todos
                                    </button>
                                    {categories.map(c => (
                                        <button
                                            key={c.slug}
                                            onClick={() => setSelectedCategory(c.slug)}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedCategory === c.slug ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price filter */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Precio (USD)</p>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number" placeholder="Min" value={priceMin}
                                        onChange={e => setPriceMin(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400 text-xs">–</span>
                                    <input
                                        type="number" placeholder="Max" value={priceMax}
                                        onChange={e => setPriceMax(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product grid */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-4xl mb-3">🔍</p>
                                <p className="text-gray-500 font-medium">No se encontraron productos</p>
                                {hasFilters && (
                                    <button onClick={clearFilters} className="mt-3 text-blue-600 text-sm hover:underline">Limpiar filtros</button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(p => (
                                    <ProductCard key={p.id} product={p} onQuote={handleQuote} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function ProductCard({ product: p, onQuote }: { product: Product; onQuote: (p: Product) => void }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
            {/* Image or color banner */}
            <div
                className="h-40 flex items-center justify-center relative overflow-hidden"
                style={{ background: p.image_url ? "transparent" : `${p.service_color}22` }}
            >
                {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <span className="text-5xl opacity-30">📦</span>
                )}
                {/* Category badge */}
                <span
                    className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: p.service_color }}
                >
                    {p.service_name}
                </span>
                {p.calculator_enabled && (
                    <span className="absolute top-2 right-2 text-[10px] bg-white/90 text-gray-600 px-2 py-0.5 rounded-full font-medium">📐 m²</span>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h3>
                {p.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">{p.description}</p>
                )}

                {/* Price */}
                <div className="mt-3 flex items-end justify-between">
                    {p.price_visible && p.price != null ? (
                        <div>
                            <span className="text-lg font-black text-gray-900">US$ {Number(p.price).toFixed(2)}</span>
                            {p.unit && <span className="text-xs text-gray-400 ml-1">/ {p.unit}</span>}
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400 italic">Precio a consultar</span>
                    )}
                </div>

                <button
                    onClick={() => onQuote(p)}
                    className="mt-3 w-full py-2 rounded-xl text-sm font-bold text-white transition-colors"
                    style={{ background: p.service_color }}
                >
                    Cotizar
                </button>
            </div>
        </div>
    );
}
