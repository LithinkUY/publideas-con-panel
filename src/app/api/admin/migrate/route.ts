import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const logs: string[] = [];

    try {
        logs.push("Starting database migration on master branch...");

        // 1. Generate unique, non-empty slugs for any service with null/empty slugs
        const emptySlugServices = await sql`
            SELECT id, name FROM services WHERE slug IS NULL OR slug = ''
        `;
        logs.push(`Found ${emptySlugServices.length} services with empty or null slugs.`);
        
        for (const s of emptySlugServices) {
            const cleanName = (s.name || "")
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            let baseSlug = cleanName || `servicio-${s.id}`;
            let finalSlug = baseSlug;
            let count = 1;
            while (true) {
                const dup = await sql`SELECT id FROM services WHERE slug = ${finalSlug} AND id != ${s.id}`;
                if (dup.length === 0) break;
                finalSlug = `${baseSlug}-${count}`;
                count++;
            }
            await sql`UPDATE services SET slug = ${finalSlug} WHERE id = ${s.id}`;
            logs.push(`Updated service ID ${s.id} slug to '${finalSlug}'`);
        }

        // 2. Clean up duplicate services by slug
        const duplicateSlugs = await sql`
            SELECT slug, COUNT(*) FROM services GROUP BY slug HAVING COUNT(*) > 1
        `;
        logs.push(`Found ${duplicateSlugs.length} duplicate slugs in 'services' table.`);

        for (const dup of duplicateSlugs) {
            const servicesWithSlug = await sql`
                SELECT id FROM services WHERE slug = ${dup.slug} ORDER BY id ASC
            `;
            const keepId = servicesWithSlug[0].id;
            const deleteIds = servicesWithSlug.slice(1).map((x: any) => x.id);
            logs.push(`For slug '${dup.slug}', keeping service ID ${keepId} and deleting IDs ${deleteIds.join(", ")}`);

            // Delete the duplicates from services
            for (const delId of deleteIds) {
                await sql`DELETE FROM services WHERE id = ${delId}`;
            }
        }

        // 3. Check if service_id column exists in service_products
        const columnCheck = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'service_products' AND column_name = 'service_id'
        `;
        
        if (columnCheck.length === 0) {
            logs.push("Adding column 'service_id' to 'service_products' table...");
            await sql`
                ALTER TABLE service_products ADD COLUMN service_id INTEGER;
            `;
            logs.push("Added column 'service_id' successfully.");
        } else {
            logs.push("Column 'service_id' already exists in 'service_products'.");
        }

        // 4. Populate service_id in service_products using slug matches
        logs.push("Populating 'service_id' matching by 'service_slug'...");
        const updateCount = await sql`
            UPDATE service_products sp
            SET service_id = s.id
            FROM services s
            WHERE sp.service_slug = s.slug
        `;
        logs.push("Populated matching service_ids.");

        // 5. Clean up orphaned products (products that don't match any existing service)
        const orphanedProducts = await sql`
            SELECT id, name, service_slug FROM service_products WHERE service_id IS NULL
        `;
        if (orphanedProducts.length > 0) {
            logs.push(`Found ${orphanedProducts.length} orphaned products. Deleting them...`);
            await sql`DELETE FROM service_products WHERE service_id IS NULL`;
        }

        // 6. Make service_id NOT NULL and add foreign key constraint
        logs.push("Setting 'service_id' column to NOT NULL...");
        await sql`
            ALTER TABLE service_products ALTER COLUMN service_id SET NOT NULL;
        `;

        // Check if foreign key constraint already exists
        const fkCheck = await sql`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'service_products' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_service_products_services'
        `;
        if (fkCheck.length === 0) {
            logs.push("Adding FOREIGN KEY constraint to 'service_products.service_id'...");
            await sql`
                ALTER TABLE service_products 
                ADD CONSTRAINT fk_service_products_services 
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
            `;
            logs.push("Added FOREIGN KEY constraint successfully.");
        }

        // 7. Ensure services.slug has UNIQUE and NOT NULL constraints
        logs.push("Ensuring 'slug' is NOT NULL in 'services' table...");
        await sql`
            ALTER TABLE services ALTER COLUMN slug SET NOT NULL;
        `;

        const uniqueCheck = await sql`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'services' AND constraint_type = 'UNIQUE' AND constraint_name = 'unique_services_slug'
        `;
        if (uniqueCheck.length === 0) {
            logs.push("Adding UNIQUE constraint to 'services.slug'...");
            await sql`
                ALTER TABLE services ADD CONSTRAINT unique_services_slug UNIQUE (slug);
            `;
            logs.push("Added UNIQUE constraint successfully.");
        }

        logs.push("Database migration completed successfully!");
        return NextResponse.json({ ok: true, logs });

    } catch (error) {
        logs.push("Migration failed with error: " + String(error));
        return NextResponse.json({ ok: false, error: String(error), logs }, { status: 500 });
    }
}
