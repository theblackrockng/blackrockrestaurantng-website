/**
 * Seed all local website images into Supabase Storage + media_assets table.
 * Run from the console/ directory: node seed-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://jwklezuaqesptccsnesr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2xlenVhcWVzcHRjY3NuZXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzc4ODQsImV4cCI6MjA5NzYxMzg4NH0.e4HTxF9iy12D-WMVdpTziIuGC_fl5iQcrzaEDMyH2NU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: ws },
});

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

// Maps filename → which section(s) the image is used in
const USAGE_MAP = {
  "heroimage.png": "hero",
  "809355C9-989D-49FD-9BD1-D6ABFFC5B395.PNG": "home-food-reel",
  "PHOTO-2026-05-23-14-42-34.jpg": "home-food-reel",
  "PHOTO-2026-05-23-14-35-14.jpg": "home-food-reel",
  "PHOTO-2026-05-23-15-14-03.jpg": "home-food-reel",
  "PHOTO-2026-05-23-15-30-40.jpg": "home-food-reel",
  "Food3.jpg": "home-food-reel",
  "Food4.jpg": "home-food-reel",
  "Food5.jpg": "home-food-reel",
  "Food7.jpg": "home-food-reel",
  "Food12.jpg": "home-food-reel",
  "Food13.jpg": "home-food-reel",
  "Food14.jpg": "home-food-reel",
  "Food15.jpg": "home-food-reel",
  "Food16.jpg": "home-food-reel",
  "noodles-stirfry.jpg": "home-food-reel",
  "vegetable-rolls.png": "home-food-reel",
};

function mimeType(ext) {
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function main() {
  const publicDir = path.join(__dirname, "../frontend/public");
  const files = fs.readdirSync(publicDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTS.has(ext);
  });

  console.log(`\nFound ${files.length} image files in frontend/public/\n`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    // Check if already in media_assets
    const { data: existing } = await supabase
      .from("media_assets")
      .select("id")
      .eq("filename", filename)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭  ${filename} — already exists, skipping`);
      skipped++;
      continue;
    }

    const filePath = path.join(publicDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const storagePath = `website/${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error: upErr } = await supabase.storage
      .from("media-library")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType(ext),
        upsert: true,
      });

    if (upErr) {
      console.error(`  ✗  ${filename} — upload error: ${upErr.message}`);
      errors++;
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media-library").getPublicUrl(storagePath);

    const { error: insErr } = await supabase.from("media_assets").insert({
      url: publicUrl,
      filename,
      file_size: fileBuffer.length,
      used_in: USAGE_MAP[filename] ?? null,
    });

    if (insErr) {
      console.error(`  ✗  ${filename} — insert error: ${insErr.message}`);
      errors++;
    } else {
      console.log(`  ✓  ${filename} → ${USAGE_MAP[filename] ?? "unassigned"}`);
      uploaded++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded} | Skipped: ${skipped} | Errors: ${errors}\n`);
}

main().catch(console.error);
