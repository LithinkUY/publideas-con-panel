"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteConfig } from "@/lib/types";
import { mockSiteConfig } from "@/lib/mock-data";

export default function HeroSection() {
    const [config, setConfig] = useState<SiteConfig>(mockSiteConfig);
    const [line1Visible, setLine1Visible] = useState(false);
    const [line2Visible, setLine2Visible] = useState(false);
    const [subVisible, setSubVisible] = useState(false);
    const [btnsVisible, setBtnsVisible] = useState(false);

    // Subtitulo state
    const [subIdx, setSubIdx] = useState(0);
    const [textVisible, setTextVisible] = useState(false);
    const [isLtr, setIsLtr] = useState(true);

    useEffect(() => {
        fetch("/api/config?key=siteconfig")
            .then(r => r.json())
            .then(val => { if (val && typeof val === "object") setConfig({ ...mockSiteConfig, ...val }); })
            .catch(() => { });
    }, []);

    // Intro
    useEffect(() => {
        const t1 = setTimeout(() => setLine1Visible(true), 300);
        const t2 = setTimeout(() => setLine2Visible(true), 1400);
        const t3 = setTimeout(() => { setSubVisible(true); setTextVisible(true); }, 2200);
        const t4 = setTimeout(() => setBtnsVisible(true), 2700);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, []);

    // Ciclo: cada 3.2s el cabezal completa una pasada
    // par = LTR (aparece texto), impar = RTL (desaparece texto, cambia subtitulo)
    useEffect(() => {
        if (!subVisible) return;
        let pass = 0; // 0 = acaba de mostrar, siguiente paso = ocultar
        const interval = setInterval(() => {
            pass++;
            if (pass % 2 === 1) {
                // Cabezal va RTL: ocultar texto
                setIsLtr(false);
                setTextVisible(false);
            } else {
                // Cabezal va LTR: avanzar subtitulo y mostrar
                setIsLtr(true);
                setSubIdx(prev => {
                    const subs = config.hero_subtitles?.length ? config.hero_subtitles : [config.hero_subtitle || ""];
                    return (prev + 1) % subs.length;
                });
                setTextVisible(true);
            }
        }, 3200);
        return () => clearInterval(interval);
    }, [subVisible, config]);

    const subtitles = config.hero_subtitles?.length
        ? config.hero_subtitles
        : [config.hero_subtitle || ""];
    const lines = config.hero_title.split("\n");

    const isBase64Video = config.hero_video_url.startsWith("data:video");
    const isBase64Image = config.hero_video_url.startsWith("data:image");
    const isExternalVideo = config.hero_video_url && !config.hero_video_url.startsWith("data:");
    const hasMedia = config.hero_video_url.length > 0;

    const inkColor = isLtr ? "#00CFFF" : "#E91E8C";

    return (
        <section className="relative w-full h-screen min-h-[600px] flex items-center overflow-hidden">
            {(isBase64Video || isExternalVideo) && (
                <video autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "brightness(0.4)" }}
                    src={config.hero_video_url}
                />
            )}
            {isBase64Image && (
                <img src={config.hero_video_url} alt="hero"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "brightness(0.4)" }}
                />
            )}
            {!hasMedia && (
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)" }}
                />
            )}
            <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)" }}
            />
            <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-16">
                <div className="max-w-2xl">

                    {/* Titulos grandes — sin cabezal */}
                    <div className="mb-5">
                        <div className="overflow-hidden mb-1">
                            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.95] text-white"
                                style={{
                                    clipPath: line1Visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                                    opacity: line1Visible ? 1 : 0,
                                    transition: "clip-path 1.1s cubic-bezier(0.4,0,0.2,1) 0.3s, opacity 0.1s 0.3s",
                                    textShadow: "0 2px 40px rgba(0,0,0,0.8)",
                                }}>
                                {lines[0] || "TITULO PRINCIPAL"}
                            </h1>
                        </div>
                        {lines[1] && (
                            <div className="overflow-hidden">
                                <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.95] text-white"
                                    style={{
                                        clipPath: line2Visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                                        opacity: line2Visible ? 1 : 0,
                                        transition: "clip-path 1.1s cubic-bezier(0.4,0,0.2,1), opacity 0.1s",
                                        textShadow: "0 2px 40px rgba(0,0,0,0.8)",
                                    }}>
                                    {lines[1]}
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Subtitulo con cabezal */}
                    <div className="flex items-center gap-3 mb-10"
                        style={{
                            opacity: subVisible ? 1 : 0,
                            transform: subVisible ? "translateY(0)" : "translateY(8px)",
                            transition: "opacity 0.5s ease, transform 0.5s ease",
                        }}>

                        {/* Icono CMYK fijo */}
                        <div className="flex gap-[2px] items-center flex-shrink-0">
                            <div className="w-1 h-7 rounded-sm bg-[#00CFFF]" />
                            <div className="w-6 h-7 rounded-sm flex flex-col overflow-hidden">
                                <div className="flex-1" style={{ background: "#E91E8C" }} />
                                <div className="flex-1" style={{ background: "#FFE000" }} />
                                <div className="flex-1" style={{ background: "#222" }} />
                            </div>
                            <div className="w-1 h-7 rounded-sm bg-[#888]" />
                        </div>

                        {/* Carril del cabezal + texto */}
                        <div className="relative flex-1 h-9 flex items-center overflow-hidden">
                            {/* Cabezal CMYK animado */}
                            {subVisible && (
                                <div
                                    className="absolute top-0 bottom-0 pointer-events-none z-20 flex items-center"
                                    style={{
                                        animation: "printerSweepLoop 3.2s cubic-bezier(0.45,0,0.55,1) infinite alternate",
                                        width: "36px",
                                    }}
                                >
                                    {/* Estela */}
                                    <div className="absolute inset-y-0 right-full w-16 pointer-events-none"
                                        style={{ background: `linear-gradient(to left, ${inkColor}25, transparent)` }}
                                    />
                                    {/* Cuerpo */}
                                    <div className="flex flex-col gap-[2px] bg-[#1a1a1a]/95 border border-white/25 rounded-sm px-[5px] py-[4px] shadow-xl">
                                        {["#00CFFF", "#E91E8C", "#FFE000", "#333"].map((c, i) => (
                                            <div key={i} className="w-4 h-[3px] rounded-sm" style={{ backgroundColor: c }} />
                                        ))}
                                        <div className="flex gap-[2px] mt-[1px] justify-center">
                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="w-[2px] h-[4px] rounded-full"
                                                    style={{ backgroundColor: ["#00CFFF", "#E91E8C", "#FFE000", "#888"][i % 4], opacity: 0.85 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Texto — aparece/desaparece en bloque */}
                            <span
                                className="relative z-10 text-xl md:text-2xl font-bold text-white whitespace-nowrap"
                                style={{
                                    textShadow: "0 2px 20px rgba(0,0,0,0.9)",
                                    opacity: textVisible ? 1 : 0,
                                    transition: textVisible
                                        ? "opacity 0.3s ease 1.6s"   // aparece a mitad del sweep LTR
                                        : "opacity 0.2s ease 1.4s",  // desaparece a mitad del sweep RTL
                                }}
                            >
                                {subtitles[subIdx] ?? ""}
                            </span>
                        </div>

                        {/* Dots */}
                        <div className="flex gap-1.5 items-center flex-shrink-0">
                            {subtitles.map((_, i) => (
                                <div key={i} className="rounded-full transition-all duration-300"
                                    style={{
                                        width: i === subIdx ? "16px" : "4px",
                                        height: "4px",
                                        backgroundColor: i === subIdx ? "#00CFFF" : "rgba(255,255,255,0.25)",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3"
                        style={{
                            opacity: btnsVisible ? 1 : 0,
                            transform: btnsVisible ? "translateY(0)" : "translateY(8px)",
                            transition: "all 0.5s ease",
                        }}>
                        <Link href={config.hero_button1_url}
                            className="px-6 py-3 text-sm font-semibold rounded-lg border backdrop-blur-sm transition-all"
                            style={{ borderColor: "rgba(0,207,255,0.5)", color: "#00CFFF", background: "rgba(0,207,255,0.05)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,207,255,0.12)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,207,255,0.05)")}>
                            {config.hero_button1_text}
                        </Link>
                        <Link href={config.hero_button2_url}
                            className="px-6 py-3 text-sm font-semibold rounded-lg border backdrop-blur-sm transition-all"
                            style={{ borderColor: "rgba(233,30,140,0.5)", color: "#E91E8C", background: "rgba(233,30,140,0.05)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(233,30,140,0.12)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(233,30,140,0.05)")}>
                            {config.hero_button2_text}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
                <div className="w-px h-10 bg-white animate-pulse" />
            </div>
        </section>
    );
}
