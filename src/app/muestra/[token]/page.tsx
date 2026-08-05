import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import SecureViewer from "./SecureViewer";

export const dynamic = "force-dynamic";

export default async function DesignSamplePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    
    // Fetch directly to avoid passing DB instances to client components
    let sample = null;
    try {
        const rows = await sql`
            SELECT id, title, image_url, active
            FROM design_samples
            WHERE token = ${token}
        `;
        if (rows.length > 0) {
            sample = rows[0];
        }
    } catch (e) {
        console.error(e);
    }

    if (!sample || !sample.active) {
        notFound();
    }

    return (
        <SecureViewer 
            imageUrl={sample.image_url} 
            title={sample.title} 
        />
    );
}
