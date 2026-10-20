export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024;
const types = new Set([
  "restaurant",
  "retail",
  "office",
  "bank",
  "clinic",
  "other",
]);

export function validateInquiry(data: {
  name: unknown;
  contact: unknown;
  type: unknown;
  description: unknown;
  consent: unknown;
  website?: unknown;
}) {
  if (data.website) return { error: "Не удалось принять форму." } as const;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const contact = typeof data.contact === "string" ? data.contact.trim() : "";
  const type = typeof data.type === "string" ? data.type : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  if (name.length < 2 || name.length > 100)
    return { error: "Укажите имя: от 2 до 100 символов." } as const;
  if (contact.length < 5 || contact.length > 160)
    return { error: "Укажите телефон, email или Telegram для связи." } as const;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone =
    /^[+\d\s()—-]+$/.test(contact) && contact.replace(/\D/g, "").length >= 7;
  const isTelegram =
    /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact) ||
    /^https:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact);
  if (!isEmail && !isPhone && !isTelegram)
    return {
      error: "Проверьте контакт: нужен email, телефон или @имя в Telegram.",
    } as const;
  if (!types.has(type)) return { error: "Выберите тип пространства." } as const;
  if (description.length < 10 || description.length > 4000)
    return { error: "Опишите задачу: от 10 до 4000 символов." } as const;
  if (data.consent !== "yes")
    return {
      error: "Для сохранения брифа необходимо согласие на обработку данных.",
    } as const;
  return { value: { name, contact, type, description } } as const;
}

export function attachmentExtension(
  bytes: Uint8Array,
): "pdf" | "png" | "jpg" | null {
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
    return "pdf";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}
