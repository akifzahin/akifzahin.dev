import { db } from "./db";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  cover_image: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PostWithHtml extends Post {
  contentHtml: string;
}

function rowToPost(row: any): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cover_image: row.cover_image,
    tags: row.tags_json ? JSON.parse(row.tags_json) : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const result = await db.execute(
    "SELECT * FROM posts WHERE draft = 0 ORDER BY published_at DESC"
  );
  return result.rows.map(rowToPost);
}

export async function getPostBySlug(slug: string): Promise<PostWithHtml | null> {
  const result = await db.execute({
    sql: "SELECT * FROM posts WHERE slug = ? AND draft = 0",
    args: [slug],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const contentJson = JSON.parse(row.content_json as string);

  const contentHtml = generateHTML(contentJson, [
    StarterKit.configure({ link: false }),
    ImageExtension,
    LinkExtension,
  ]);

  return {
    ...rowToPost(row),
    contentHtml,
  };
}