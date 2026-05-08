"use client";
import { useEffect, useState } from "react";
import { MapPin, ExternalLink, Send } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
export interface SocialLink {
    platform: string;
    url: string;
}

export interface FooterConfig {
    social: SocialLink[];
    showroom_address: string;
    showroom_maps_url: string;
    showroom_lat: number;
    showroom_lng: number;
    whatsapp_number: string;
    whatsapp_text: string;
    email_placeholder: string;
    join_team_url: string;
    payment_methods: string[];
    copyright: string;
}

export const defaultFooterConfig: FooterConfig = {
    social: [
        { platform: "Instagram", url: "https://instagram.com/" },
        { platform: "Facebook", url: "https://facebook.com/" },
        { platform: "TikTok", url: "https://tiktok.com/" },
    ],
    showroom_address: "Arenal Grande 2667, Montevideo",
    showroom_maps_url: "https://maps.google.com/?q=Arenal+Grande+2667+Montevideo",
    showroom_lat: -34.9011,
    showroom_lng: -56.1645,
    whatsapp_number: "59899000000",
    whatsapp_text: "Hola! Quiero consultar sobre sus servicios.",
    email_placeholder: "Tu correo electrónico",
    join_team_url: "/contacto",
    payment_methods: ["Mercado Pago", "Handy"],
    copyright: "© 2026 Publideas UY. Todos los derechos reservados.",
};

// ── Social icons (inline SVG) ─────────────────────────────────
function SocialIcon({ platform }: { platform: string }) {
    const p = platform.toLowerCase();
    if (p === "instagram") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    );
    if (p === "facebook") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
    if (p === "tiktok") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    );
    return <span className="text-xs font-bold">{platform[0]}</span>;
}

// ── Footer component ──────────────────────────────────────────
export default function Footer() {
    const [cfg, setCfg] = useState<FooterConfig>(defaultFooterConfig);
    const [email, setEmail] = useState("");
    const [logoText, setLogoText] = useState("Publideas UY");

    useEffect(() => {
        fetch("/api/config?key=footer")
            .then(r => r.json())
            .then(val => { if (val) setCfg({ ...defaultFooterConfig, ...val }); })
            .catch(() => { });
        fetch("/api/config?key=header")
            .then(r => r.json())
            .then(val => { if (val?.logo_text) setLogoText(val.logo_text); })
            .catch(() => { });
    }, []);

    const whatsappHref = `https://wa.me/${cfg.whatsapp_number}?text=${encodeURIComponent(cfg.whatsapp_text)}`;
    // OpenStreetMap embed (no API key needed)
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${cfg.showroom_lng - 0.008}%2C${cfg.showroom_lat - 0.005}%2C${cfg.showroom_lng + 0.008}%2C${cfg.showroom_lat + 0.005}&layer=mapnik&marker=${cfg.showroom_lat}%2C${cfg.showroom_lng}`;

    return (
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a]">
            {/* Main grid */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* Col 1 — Redes sociales */}
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-white/40 mb-5">SEGUINOS EN</p>
                    <div className="space-y-3">
                        {cfg.social.map((s, i) => (
                            <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#2a2a2a] text-white/60 hover:text-white hover:border-white/20 transition-all group"
                            >
                                <span className="text-white/40 group-hover:text-white transition-colors">
                                    <SocialIcon platform={s.platform} />
                                </span>
                                <span className="text-sm font-semibold tracking-wider uppercase">{s.platform}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Col 2 — Showroom / Mapa */}
                <div>
                    <p className="text-[10px] font-semibold tracking-widest text-white/40 mb-5">VISITÁ NUESTRO SHOWROOM</p>
                    <div className="flex items-start gap-2 mb-4">
                        <MapPin size={14} className="text-[#00CFFF] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/70">{cfg.showroom_address}</span>
                    </div>
                    {/* Mapa */}
                    <div className="rounded-xl overflow-hidden border border-[#2a2a2a] mb-3" style={{ height: "160px" }}>
                        <iframe
                            src={mapSrc}
                            width="100%"
                            height="160"
                            style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                            loading="lazy"
                            title="Showroom location"
                        />
                    </div>
                    <a
                        href={cfg.showroom_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-xs font-semibold hover:bg-[#00CFFF]/20 transition-colors"
                    >
                        <MapPin size={12} /> ABRIR EN GOOGLE MAPS
                    </a>
                </div>

                {/* Col 3 — Contacto */}
                <div className="space-y-5">
                    <p className="text-[10px] font-semibold tracking-widest text-white/40">AYUDA Y CONTACTO</p>

                    {/* WhatsApp */}
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#22c55e] transition-colors"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Contactar por WhatsApp
                    </a>

                    {/* Newsletter */}
                    <div>
                        <p className="text-xs text-white/40 mb-2">Recibí promociones y novedades exclusivas</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={cfg.email_placeholder}
                                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#00CFFF]/50 transition-colors"
                            />
                            <button className="w-9 h-9 rounded-xl bg-[#00CFFF] flex items-center justify-center text-black hover:bg-[#00CFFF]/80 transition-colors flex-shrink-0">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Sumate al equipo */}
                    <a
                        href={cfg.join_team_url}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#2a2a2a] text-white/50 text-xs font-semibold hover:text-white hover:border-white/20 transition-all"
                    >
                        Sumate al equipo <ExternalLink size={11} />
                    </a>

                    {/* Pagos */}
                    <div>
                        <p className="text-[10px] font-semibold tracking-widest text-white/30 mb-2">PAGOS 100% SEGUROS</p>
                        <div className="flex gap-2 flex-wrap">
                            {cfg.payment_methods.map((m, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-white/50 font-semibold">
                                    {m}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#1a1a1a] px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black italic text-white">{logoText}</span>
                    <div className="flex gap-[3px]">
                        {["#00CFFF", "#E91E8C", "#FFE000", "#FFFFFF"].map((c, i) => (
                            <div key={i} className="h-[3px] w-[10px] rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <span className="text-xs text-white/30 ml-2">{cfg.copyright}</span>
                </div>
                <div className="flex gap-4 text-xs text-white/30">
                    <a href="/terminos" className="hover:text-white/60 transition-colors">Términos y Condiciones</a>
                    <a href="/privacidad" className="hover:text-white/60 transition-colors">Privacidad</a>
                </div>
            </div>
        </footer>
    );
}
