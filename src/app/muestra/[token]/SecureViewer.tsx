"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

export default function SecureViewer({ imageUrl, title }: { imageUrl: string; title: string }) {
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);
        const handleVisibilityChange = () => setIsFocused(document.visibilityState === 'visible');
        
        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    // Also try to prevent keyboard shortcuts for screenshots (PrintScreen) where possible
    // Note: OS level shortcuts often bypass browser DOM completely, 
    // but we can try to intercept if focus is still on the window
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p') || (e.metaKey && e.shiftKey && e.key === 's') || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))) {
                // If they hit a known screenshot combo, hide the image immediately
                setIsFocused(false);
                // Try to copy empty to clipboard to override printscreen
                navigator.clipboard.writeText("Captura deshabilitada por seguridad");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col select-none"
             onContextMenu={(e) => e.preventDefault()}
             onDragStart={(e) => e.preventDefault()}>
             
            {/* Header minimalista */}
            <header className="p-4 flex items-center justify-between border-b border-white/10 z-50 bg-black">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00CFFF] to-[#E91E8C] flex items-center justify-center text-white font-bold text-xs">P</div>
                    <div>
                        <h1 className="text-white text-sm font-bold truncate max-w-[200px] sm:max-w-xs">{title}</h1>
                        <p className="text-[#00CFFF] text-[10px] flex items-center gap-1">
                            <Lock size={10} /> Visualización Segura
                        </p>
                    </div>
                </div>
            </header>

            {/* Contenedor principal de la imagen */}
            <main className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
                
                {/* 
                  El contenedor del diseño.
                  Si pierde el foco (blur), se oculta totalmente.
                */}
                <div className={`relative max-w-5xl max-h-[85vh] transition-all duration-75 ${!isFocused ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    
                    {/* Usamos backgroundImage en lugar de img para evitar "Guardar imagen como..." */}
                    <div 
                        className="w-[90vw] h-[80vh] md:w-[70vw] bg-contain bg-center bg-no-repeat rounded-lg"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                    />

                    {/* Capa invisible para interceptar clics e intentos de arrastre */}
                    <div className="absolute inset-0 z-10 bg-transparent" />

                    {/* Marca de agua repetida sutil */}
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-[0.03] mix-blend-overlay flex flex-wrap gap-10 items-center justify-center select-none">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <span key={i} className="text-white font-black text-2xl rotate-[-30deg]">MUESTRA PUBLIDEAS</span>
                        ))}
                    </div>
                </div>

                {/* Mensaje cuando la pantalla está oculta (Blur) */}
                {!isFocused && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 text-center p-6">
                        <Lock size={48} className="text-white/20 mb-4" />
                        <h2 className="text-white text-xl font-bold mb-2">Pantalla Oculta por Seguridad</h2>
                        <p className="text-white/50 text-sm max-w-sm">
                            El diseño se ha ocultado porque la ventana perdió el foco o se intentó utilizar una herramienta de captura. 
                            <br/><br/>
                            Haz clic aquí para seguir viendo.
                        </p>
                    </div>
                )}
            </main>
            
            {/* Disclaimer inferior */}
            <footer className="p-3 text-center text-[10px] text-white/30 z-50 bg-black">
                Este diseño es propiedad exclusiva de Publideas. Su descarga, captura o reproducción están estrictamente prohibidas.
            </footer>
        </div>
    );
}
