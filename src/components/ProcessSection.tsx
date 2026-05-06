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

export default function ProcessSection() {
    const [cfg, setCfg] = useState<ProcessConfig>(defaultProcessConfig);

    useEffect(() => {
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
    }, []);

    const activeSteps = cfg.steps.filter(s => s.active);

    return (
        <section className="py-20 bg-[#0d0d0d] border-y border-[#1a1a1a]">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <p className="text-white/40 text-sm font-semibold tracking-widest mb-10">
                    {cfg.title}
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {activeSteps.map((step, i) => (
                        <div key={step.label + i} className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className="w-16 h-16 rounded-full border border-[#2a2a2a] flex items-center justify-center overflow-hidden bg-[#111]"
                                    style={step.icon_color && !step.icon_url ? { backgroundColor: step.icon_color } : {}}
                                >
                                    {step.icon_url
                                        ? <img src={step.icon_url} alt={step.label} className="w-10 h-10 object-contain" />
                                        : <span className="text-lg font-bold text-white/40">{step.icon}</span>
                                    }
                                </div>
                                <span className="text-xs text-white/40 font-semibold tracking-widest">
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
                    ))}
                </div>
            </div>
        </section>
    );
}
