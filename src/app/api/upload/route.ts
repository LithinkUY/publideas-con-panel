import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file = data.get("file") as File | null;
        const type = data.get("type") as string | null; // "favicon" | "logo" | "media" | undefined

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        let filename: string;

        if (type === "favicon") {
            // Special: write to public/favicon.ico (and also to uploads for backup)
            const faviconPath = path.join(process.cwd(), "public", "favicon.ico");
            await writeFile(faviconPath, buffer);
            filename = "favicon.ico";
            return NextResponse.json({ url: `/favicon.ico?v=${Date.now()}` });
        }

        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
        const slug = type === "logo" ? "logo" : type === "logo_mobile" ? "logo-mobile" : `media`;
        filename = `${slug}-${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);
        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (err) {
        console.error("[upload]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
