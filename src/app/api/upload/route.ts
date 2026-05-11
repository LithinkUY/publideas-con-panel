import { NextRequest, NextResponse } from "next/server";

// ── Cloudinary upload (production) ───────────────────────────
async function uploadToCloudinary(
    buffer: Buffer,
    filename: string,
    folder: string,
    resourceType: "image" | "video" | "raw" = "image"
): Promise<string> {
    const cloudinary = await import("cloudinary");
    const v2 = cloudinary.v2;

    v2.config({ cloudinary_url: process.env.CLOUDINARY_URL });

    return new Promise((resolve, reject) => {
        const stream = v2.uploader.upload_stream(
            {
                folder: `publideas/${folder}`,
                public_id: filename,
                resource_type: resourceType,
                overwrite: true,
            },
            (err, result) => {
                if (err || !result) return reject(err ?? new Error("Upload failed"));
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

// ── Local filesystem upload (development) ────────────────────
async function uploadToLocal(
    buffer: Buffer,
    filename: string,
    type: string
): Promise<string> {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    if (type === "favicon") {
        const faviconPath = path.join(process.cwd(), "public", "favicon.ico");
        await writeFile(faviconPath, buffer);
        return `/favicon.ico?v=${Date.now()}`;
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${filename}`;
}

// ── Route handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file = data.get("file") as File | null;
        const type = (data.get("type") as string | null) ?? "media";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
        const slug =
            type === "logo" ? "logo" :
                type === "logo_mobile" ? "logo-mobile" :
                    type === "favicon" ? "favicon" :
                        "media";

        const filename = `${slug}-${Date.now()}.${ext}`;
        const isVideo = file.type.startsWith("video/");
        const useCloudinary = !!process.env.CLOUDINARY_URL;

        let url: string;

        if (useCloudinary) {
            const folder =
                type === "logo" || type === "logo_mobile" ? "logos" :
                    type === "favicon" ? "favicon" :
                        "media";
            const resourceType = isVideo ? "video" : "image";
            url = await uploadToCloudinary(buffer, slug, folder, resourceType);
        } else {
            // Desarrollo local → filesystem
            url = await uploadToLocal(buffer, filename, type);
        }

        return NextResponse.json({ url });
    } catch (err) {
        console.error("[upload]", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
