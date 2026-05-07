"use client";
import { useEffect, useState } from "react";

export interface ProcessStep {
    icon: string;
    label: string;
    description?: string;
    active: boolean;
    icon_url?: string;
    icon_color?: string;
}

export interface ProcessConfig {
    title: string;
    steps: ProcessStep[];
}

export const defaultProcessConfig: ProcessConfig = {
    title: "¿Cómo trabajamos?",
    steps: [
        { icon: "💡", label: "IDEA", description: "Nos contás tu idea y definimos el proyecto.", active: true },
        { icon: "✏️", label: "DISEÑO", description: "Preparamos los artes y medidas necesarias.", active: true },
        { icon: "⚙️", label: "PRODUCCIÓN", description: "Producimos con materiales de alta calidad.", active: true },
        { icon: "🚚", label: "ENTREGA", description: "Entregamos en tiempo y forma acordados.", active: true },
    ],
};

interface ProcessSectionProps {
    showAlways?: boolean;
}

export default function ProcessSection({ showAlways = false }: ProcessSectionProps) {
    const [cfg, setCfg] = useState<ProcessConfig>(defaultProcessConfig);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        fetch("/api/process")
            .then(r => r.json())
            .then((steps: (ProcessStep & { sort_order?: number })[]) => {
                if (Array.isArray(steps) && steps.length > 0) {
                    setCfg({
                        title: cfg.title,
                        steps: steps.map(s => ({
                            icon: String(s.icon ?? "⚙️"),
                            label: String(s.label),
                            description: String(s.description ?? ""),
                            active: Boolean(s.active),
                            icon_url: s.icon_url ?? undefined,
                            icon_color: s.icon_color ?? undefined,
                        })),
                    });
                }
            })
            .catch(() => { });

        if (!showAlways) {
            fetch("/api/home-sections")
                .then(r => r.json())
                .then((sections: { type: string; active: boolean }[]) => {
                    if (Array.isArray(sections)) {
                        const ps = sections.find(s => s.type === "process");
                        if (ps && !ps.active) setHidden(true);
                    }
                })
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAlways]);

    if (hidden) return null;

    const activeSteps = cfg.steps.filter(s => s.active);

    return (
        <section className="py-20 bg-[#0a0a0a] border-y border-[#1a1a1a]">
            <div className="max-w-5xl mx-auto px-6">
                {/* Heading */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1 h-8 rounded-full bg-[#FFE000]" />
                    <div>
                        <p className="text-sm font-bold text-white/80">{cfg.title}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Así trabajamos con vos, paso a paso.</p>
                    </div>
                </div>

                {/* Cards grid — identical to portal services */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeSteps.map((step, i) => {
                        const glowColor = step.icon_color || "#FFE000";
                        return (
                            <div
                                key={step.label + i}
                                className="relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 aspect-square cursor-default transition-all duration-300 group hover:bg-[#111]"
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = glowColor + "55";
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${glowColor}22`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = "";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                                }}
                            >
                                {/* Step number badge */}
                                <span
                                    className="absolute top-3 left-3 text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: glowColor }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>

                                {/* Icon */}
                                {step.icon_url ? (
                                    <img
                                        src={step.icon_url}
                                        alt={step.label}
                                        className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                                    />
                                ) : (
                                    <span className="text-4xl transition-transform duration-300 group-hover:scale-110 select-none">
                                        {step.icon}
                                    </span>
                                )}

                                {/* Label */}
                                <p
                                    className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center transition-colors duration-300 group-hover:text-white/80"
                                >
                                    {step.label}
                                </p>

                                {/* Description */}
                                {step.description && (
                                    <p className="text-[9px] text-white/20 text-center leading-tight">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
