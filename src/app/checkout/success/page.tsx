"use client";
import { useSearchParams } from "next/navigation";
import { Check, User } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
    const params = useSearchParams();
    const paymentId = params.get("payment_id");
    const externalRef = params.get("external_reference"); // order_number sent to MP
    const status = params.get("status") ?? params.get("collection_status");

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#0d0d0d] border border-[#2a2a2a] rounded-2xl p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center mx-auto">
                    <Check size={32} className="text-green-400" />
                </div>
                <h1 className="text-xl font-black text-white">¡Pago exitoso!</h1>
                <p className="text-sm text-white/50">Tu pago fue procesado correctamente por MercadoPago.</p>
                {externalRef && (
                    <p className="text-sm text-white/70">
                        N° de orden: <span className="font-mono font-black text-[#00CFFF]">{externalRef}</span>
                    </p>
                )}
                {paymentId && <p className="text-xs text-white/30">ID de pago MP: {paymentId}</p>}
                {status && status !== "approved" && (
                    <p className="text-xs text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-2">
                        Estado: {status}
                    </p>
                )}
                <div className="space-y-3 pt-2">
                    <Link href="/portal" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00CFFF] text-black font-black text-sm hover:bg-[#00CFFF]/90 transition-colors">
                        <User size={16} /> Ir a mi panel de cliente
                    </Link>
                    <Link href="/" className="inline-block w-full py-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white/60 font-bold text-sm hover:text-white transition-colors">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccess() {
    return <Suspense><SuccessContent /></Suspense>;
}
