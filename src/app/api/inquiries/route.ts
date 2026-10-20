import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  MAX_BODY_BYTES,
  MAX_FILE_BYTES,
  attachmentExtension,
  validateInquiry,
} from "@/lib/inquiries";

export const runtime = "nodejs";
const requests = new Map<string, { count: number; expires: number }>();

export async function POST(request: Request) {
  const json = (body: object, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const incoming = new URL(origin);
      // Next can use an internal HTTP origin behind a reverse proxy. The
      // browser's public host must still match the request Host exactly.
      const sameHost = incoming.host === request.headers.get("host");
      if (
        !["http:", "https:"].includes(incoming.protocol) ||
        (!sameHost && origin !== new URL(request.url).origin)
      )
        return json({ error: "Отправьте форму с этого сайта." }, 403);
    } catch {
      return json({ error: "Отправьте форму с этого сайта." }, 403);
    }
  }
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  for (const [ip, value] of requests)
    if (value.expires < now) requests.delete(ip);
  if (requests.size > 1000) requests.delete(requests.keys().next().value!);
  const limit = requests.get(key) || { count: 0, expires: now + 60_000 };
  if (limit.count >= 5)
    return json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      429,
    );
  limit.count++;
  requests.set(key, limit);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return json({ error: "Неверный формат формы." }, 415);
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES)
    return json({ error: "Файл слишком большой. Допустимо до 5 МБ." }, 413);
  let directory: string | undefined;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Форма пуста." }, 400);
    let size = 0;
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return json({ error: "Файл слишком большой. Допустимо до 5 МБ." }, 413);
      }
      chunks.push(new Uint8Array(value));
    }
    const data = await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
    const validated = validateInquiry({
      name: data.get("name"),
      contact: data.get("contact"),
      type: data.get("type"),
      description: data.get("description"),
      consent: data.get("consent"),
      website: data.get("website"),
    });
    if ("error" in validated) return json({ error: validated.error }, 400);
    const attachment = data.get("attachment");
    let file: { bytes: Uint8Array; extension: string } | undefined;
    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > MAX_FILE_BYTES)
        return json({ error: "Размер файла — не более 5 МБ." }, 413);
      const bytes = new Uint8Array(await attachment.arrayBuffer());
      const extension = attachmentExtension(bytes);
      if (!extension)
        return json({ error: "Прикрепите файл PDF, JPG или PNG." }, 400);
      file = { bytes, extension };
    }
    const id = randomUUID();
    // Runtime-only private output, never an input asset for server file tracing.
    directory = path.join(
      /* turbopackIgnore: true */ process.env.INQUIRY_STORAGE_DIR ||
        path.join(process.cwd(), ".data", "inquiries"),
      id,
    );
    await mkdir(directory, { recursive: true, mode: 0o700 });
    if (file)
      await writeFile(
        path.join(directory, `attachment.${file.extension}`),
        file.bytes,
        { flag: "wx", mode: 0o600 },
      );
    await writeFile(
      path.join(directory, "brief.json"),
      JSON.stringify(
        {
          id,
          createdAt: new Date().toISOString(),
          ...validated.value,
          attachment: file ? `attachment.${file.extension}` : null,
          mode: "demo",
          deliveredToCompany: false,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
    return json({ id, status: "saved", mode: "demo" }, 201);
  } catch {
    if (directory)
      await rm(directory, { recursive: true, force: true }).catch(() => {});
    return json(
      { error: "Не удалось сохранить бриф. Попробуйте ещё раз позднее." },
      500,
    );
  }
}
