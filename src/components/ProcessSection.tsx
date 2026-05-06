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
    title: "Que es USER?",
    steps: [
        { icon: "I", label: "IDEA", description: "", active: true },
        { icon: "D", label: "DISENO", description: "", active: true },
        { icon: "P", label: "PRODUCCION", description: "", active: true },
        { icon: "E", label: "ENTREGA", description: "", active: true },
    ],
};

interface ProcessSectionProps {
    /** If true, always show regardless of home_sections active flag (used in /proceso page) */
    showAlways?: boolean;
}

export default function ProcessSection({ showAlways = false }: ProcessSectionProps) {
    const [cfg, setCfg] = useState<ProcessConfig>(defaultProcessConfig);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        // Load steps from /api/process
        fetch("/api/process")
            .then(r => r.json())
            .then((steps: (ProcessStep & { sort_order?: number })[]) => {
                if (Array.isArray(steps) && steps.length > 0) {
                    setCfg({
                        title: "Que es USER?", steps: steps.map(s => ({
                            icon: String(s.icon ?? ""),
                            label: String(s.label),
                            description: String(s.description ?? ""),
                            active: Boolean(s.active),
                            icon_url: s.icon_url ?? undefined,
                            icon_color: s.icon_color ?? undefined,
                        }))
                    });
                }
            })
            .catch(() => { });

        // Check visibility in home_sections (only relevant for home page)
        if (!showAlways) {
            fetch("/api/home-sections")
                .then(r => r.json())
                .then((sections: { type: string; active: boolean }[]) => {
                    if (Array.isArray(sections)) {
                        const processSection = sections.find(s => s.type === "process");
                        if (processSection && !processSection.active) {
                            setHidden(true);
                        }
                    }
                })
                .catch(() => { });
        }
    }, [showAlways]);

    if (hidden) return null;

    const activeSteps = cfg.steps.filter(s => s.active);

    return (
        <section className="py-20 bg-[#0d0d0d] border-y border-[#1a1a1a]">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <p className="text-white/40 text-sm font-semibold tracking-widest mb-10">
                    {cfg.title}
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {activeSteps.map((step, i) => {
                        const glowColor = step.icon_color || "#00CFFF";
                        return (
                            <div key={step.label + i} className="flex items-center gap-4">
                                <div className="flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-16 h-16 rounded-full border border-[#2a2a2a] flex items-center justify-center overflow-hidden bg-[#111] transition-all duration-300 cursor-pointer group-hover:scale-110 group-hover:border-transparent"
                                        style={step.icon_color && !step.icon_url ? { backgroundColor: step.icon_color } : {}}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.boxShadow =
                                                `0 0 18px ${glowColor}99, 0 0 40px ${glowColor}44`;
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.boxShadow = "";
                                        }}
                                    >
                                        {step.icon_url
                                            ? <img src={step.icon_url} alt={step.label} className="w-10 h-10 object-contain transition-all duration-300 group-hover:scale-110" />
                                            : <span className="text-lg font-bold text-white/60 transition-all duration-300 group-hover:text-white">{step.icon}</span>
                                        }
                                    </div>
                                    <span className="text-xs text-white/40 font-semibold tracking-widest transition-colors duration-300 group-hover:text-white/70">
                                        {step.label}
                                    </span>
                                    {step.description && (
                                        <span className="text-[10px] text-white/25 max-w-[80px] text-center leading-tight">
                                            {step.description}
                                        </span>
                                    )}
                                </div>
                                {i < activeSteps.length - 1 && (
                                    <div className="w-8 h-px bg-[#2a2a2a]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
