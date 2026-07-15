import { readdir, readFile } from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { generateJSON } from "@tiptap/html";
import { JSDOM } from "jsdom";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { createClient } from "@libsql/client";
import "dotenv/config";

const BLOG_DIR = path.resolve("src/content/blog");

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Tiptap's HTML parser needs a DOM — provide a fake one via jsdom since this runs in plain Node
const dom = new JSDOM("<!DOCTYPE html>");
// @ts-ignore
global.window = dom.window;
// @ts-ignore
global.document = dom.window.document;

async function migrate() {
  const files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} markdown post(s).`);

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = await readFile(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const existing = await db.execute({
      sql: "SELECT id FROM posts WHERE slug = ?",
      args: [slug],
    });

    if (existing.rows.length > 0) {
      console.log(`Skipping "${slug}" — already migrated.`);
      continue;
    }

    const html = await marked(content);
    const contentJson = generateJSON(html, [
      StarterKit,
      ImageExtension,
      LinkExtension,
    ]);

    const draft = data.draft ? 1 : 0;
    const dateStr = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO posts
            (slug, title, description, content_json, cover_image, tags_json, draft, created_at, updated_at, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        data.title ?? "Untitled",
        data.description ?? "",
        JSON.stringify(contentJson),
        data.image ?? null,
        JSON.stringify(data.tags ?? []),
        draft,
        dateStr,
        dateStr,
        draft === 0 ? dateStr : null,
      ],
    });

    console.log(`Migrated "${slug}".`);
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});