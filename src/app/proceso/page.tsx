import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProcessSection from "@/components/ProcessSection";

export const metadata = {
    title: "Proceso de Pedidos | Publideas UY",
    description: "Conocé cómo funciona nuestro proceso de pedidos, desde la idea hasta la entrega.",
};

export default function ProcesoPedidosPage() {
    return (
        <main className="min-h-screen bg-[#0d0d0d]">
            <Header />

            {/* Hero header */}
            <div className="py-20 px-6 text-center border-b border-[#1a1a1a]">
                <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">
                    Cómo trabajamos
                </p>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Proceso de Pedidos
                </h1>
                <p className="text-white/50 text-base max-w-xl mx-auto">
                    Desde que nos contactás hasta que recibís tu producto, te acompañamos en cada etapa.
                </p>
            </div>

            {/* Steps section (loaded from admin config) */}
            <ProcessSection showAlways />

            {/* CTA */}
            <div className="py-20 px-6 text-center">
                <p className="text-white/40 text-sm mb-6">¿Listo para empezar?</p>
                <a
                    href="/pedido"
                    className="inline-block px-8 py-3 rounded-full border border-white text-white font-semibold hover:bg-white hover:text-black transition-all"
                >
                    Hacé tu pedido →
                </a>
            </div>

            <Footer />
        </main>
    );
}
