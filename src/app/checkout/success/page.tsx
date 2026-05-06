"use client";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
    const params = useSearchParams();
    const paymentId = params.get("payment_id");
    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto">
                    <Check size={32} className="text-green-400" />
                </div>
                <h1 className="text-xl font-black text-white">¡Pago exitoso!</h1>
                <p className="text-sm text-white/50">Tu pago fue procesado correctamente.</p>
                {paymentId && <p className="text-xs text-white/30">ID de pago: {paymentId}</p>}
                <Link href="/" className="inline-block w-full py-3 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/90 transition-colors">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccess() {
    return <Suspense><SuccessContent /></Suspense>;
}
