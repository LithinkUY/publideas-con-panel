"use client";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Service, ServiceProduct } from "@/lib/types";
import ServiceProductModal from "./ServiceProductModal";

function mapApiService(r: Record<string, unknown>): Service {
    return {
        id: String(r.id ?? ""),
        name: String(r.name ?? ""),
        description: String(r.description ?? ""),
        image_url: String(r.image_url ?? r.icon ?? ""),
        color: String(r.color ?? "#1a2a3a"),
        order: Number(r.sort_order ?? r.order ?? 0),
        active: r.active === true || r.active === "true",
        products: Array.isArray(r.products)
            ? (r.products as Record<string, unknown>[]).map(p => ({
                id: String(p.id ?? ""),
                service_id: String(p.service_id ?? r.id ?? ""),
                service_slug: String(p.service_slug ?? r.slug ?? ""),
                name: String(p.name ?? ""),
                description: String(p.description ?? ""),
                price: p.price != null ? Number(p.price) : undefined,
                unit: p.unit ? String(p.unit) : undefined,
                image_url: p.image_url ? String(p.image_url) : undefined,
                price_visible: p.price_visible !== false,
                calculator_enabled: p.calculator_enabled === true,
                price_per_m2: p.price_per_m2 != null ? Number(p.price_per_m2) : undefined,
                active: p.active === true || p.active === "true",
                order: Number(p.sort_order ?? p.order ?? 0),
                sort_order: Number(p.sort_order ?? 0),
                details: Array.isArray(p.details) ? p.details : [],
                variant_ids: Array.isArray(p.variant_ids) ? (p.variant_ids as number[]) : [],
            } as ServiceProduct))
            : [],
    };
}

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="relative rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group text-left"
            style={{ width: "240px", height: "300px" }}
        >
            <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{
                    background: service.image_url
                        ? `url(${service.image_url}) center/cover`
                        : service.color,
                    backgroundColor: service.color,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg leading-tight mb-1">{service.name}</h3>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{service.description}</p>
                <span className="mt-2 inline-block text-[10px] font-bold text-[#00CFFF] bg-[#00CFFF]/10 px-2 py-0.5 rounded-full w-fit opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver productos →
                </span>
            </div>
            <div className="absolute inset-0 border border-white/0 group-hover:border-[#00CFFF]/30 rounded-xl transition-all duration-300" />
        </button>
    );
}

export default function ServicesSlider() {
    const [list, setList] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true });

    useEffect(() => {
        fetch("/api/services")
            .then(r => r.json())
            .then((rows: unknown[]) =>
                setList(rows.map(raw => mapApiService(raw as Record<string, unknown>)))
            )
            .catch(err => console.error("Error cargando servicios:", err))
            .finally(() => setLoading(false));
    }, []);

    const active = list.filter(s => s.active).sort((a, b) => a.order - b.order);

    return (
        <>
            <section className="py-20 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black uppercase">
                            NUESTROS{" "}
                            <span style={{ color: "#00CFFF" }}>SERVICIOS</span>
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => emblaApi?.scrollPrev()}
                                className="w-9 h-9 rounded-full border border-[#2a2a2a] flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => emblaApi?.scrollNext()}
                                className="w-9 h-9 rounded-full border border-[#2a2a2a] flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex-shrink-0 rounded-xl bg-[#1a1a1a] animate-pulse" style={{ width: 240, height: 300 }} />
                            ))}
                        </div>
                    )}

                    {!loading && active.length === 0 && (
                        <p className="text-white/30 text-sm py-10">No hay servicios activos configurados.</p>
                    )}

                    {!loading && active.length > 0 && (
                        <div className="overflow-hidden" ref={emblaRef}>
                            <div className="flex gap-4">
                                {active.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        onClick={() => setSelectedService(service)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <ServiceProductModal
                service={selectedService}
                onClose={() => setSelectedService(null)}
            />
        </>
    );
}
