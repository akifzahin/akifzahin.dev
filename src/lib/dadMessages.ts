import { db } from "./db";
export interface DadMessage {
  id: number;
  type: "text" | "image";
  body: string | null;
  image_url: string | null;
  created_at: string;
}

export async function getDadMessages(): Promise<DadMessage[]> {
  const result = await db.execute(
    "SELECT id, type, body, image_url, created_at FROM dad_messages ORDER BY created_at ASC",
  );
  return result.rows.map((r) => ({
    id: r.id as number,
    type: r.type as "text" | "image",
    body: r.body as string | null,
    image_url: r.image_url as string | null,
    created_at: r.created_at as string,
  }));
}

export async function createDadMessage(
  type: "text" | "image",
  body: string | null,
  imageUrl: string | null
): Promise<number> {
  const result = await db.execute({
    sql: "INSERT INTO dad_messages (type, body, image_url) VALUES (?, ?, ?)",
    args: [type, body, imageUrl],
  });
  return Number(result.lastInsertRowid);
}

export async function deleteDadMessage(id: number): Promise<void> {
  await db.execute({
    sql: "DELETE FROM dad_messages WHERE id = ?",
    args: [id],
  });
}