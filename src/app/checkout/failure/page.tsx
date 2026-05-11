"use client";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailure() {
    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-400/20 flex items-center justify-center mx-auto">
                    <XCircle size={32} className="text-red-400" />
                </div>
                <h1 className="text-xl font-black text-white">El pago no fue procesado</h1>
                <p className="text-sm text-white/50">Podés intentarlo nuevamente o elegir otro método de pago.</p>
                <div className="flex gap-3">
                    <button onClick={() => window.history.back()} className="flex-1 py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white/60 text-sm hover:text-white transition-colors">
                        Reintentar
                    </button>
                    <Link href="/" className="flex-1 py-3 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/90 transition-colors flex items-center justify-center">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
