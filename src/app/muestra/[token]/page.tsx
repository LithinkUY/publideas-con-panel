import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import SecureViewer from "./SecureViewer";

export const dynamic = "force-dynamic";

export default async function DesignSamplePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    
    // Fetch directly to avoid passing DB instances to client components
    let sample = null;
    let isExpired = false;
    try {
        const rows = await sql`
            SELECT id, title, image_url, active, created_at
            FROM design_samples
            WHERE token = ${token}
        `;
        if (rows.length > 0) {
            sample = rows[0];
            const created = new Date(sample.created_at).getTime();
            const now = new Date().getTime();
            if (now - created > 24 * 60 * 60 * 1000) {
                isExpired = true;
            }
        }
    } catch (e) {
        console.error(e);
    }

    if (!sample || !sample.active) {
        notFound();
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <span className="text-red-500 text-2xl">⏳</span>
                </div>
                <h1 className="text-white text-xl font-bold mb-2">Enlace Caducado</h1>
                <p className="text-white/50 text-sm max-w-sm">
                    Por seguridad, los enlaces de muestras de diseño tienen una validez máxima de 24 horas. 
                    <br/><br/>
                    Por favor, solicita a Publideas un nuevo enlace.
                </p>
            </div>
        );
    }

    return (
        <SecureViewer 
            imageUrl={sample.image_url} 
            title={sample.title} 
        />
    );
}
