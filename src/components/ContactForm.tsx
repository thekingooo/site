"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, LoaderCircle, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { scenes } from "@/lib/content";

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [requestId, setRequestId] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const submitted = useRef<Record<string, string>>({});
  const upload = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    submitted.current = Object.fromEntries(
      ["name", "contact", "type", "description"].map((key) => [
        key,
        String(data.get(key) || ""),
      ]),
    );
    if (file) data.set("attachment", file);
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Не удалось сохранить бриф. Попробуйте ещё раз.",
        );
      setRequestId(result.id);
      setStatus("success");
      window.dispatchEvent(
        new CustomEvent("prostranstvo:interaction", {
          detail: { type: "inquiry", status: "saved" },
        }),
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Ошибка соединения. Попробуйте ещё раз.",
      );
    }
  }
  function downloadBrief() {
    const data = submitted.current;
    const content = `БРИФ / ПРОСТРАНСТВО\n\nИмя: ${data.name}\nКонтакт: ${data.contact}\nТип объекта: ${data.type}\nЗадача: ${data.description}\n${file ? `Приложение: ${file.name}\n` : ""}\nНомер: ${requestId}\nДемонстрационный бриф. Не отправлен компании.`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "prostranstvo-brief.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="contact-form-wrap">
      <p className="form-caption">
        <span className="live-dot" /> НАЧНЁМ ЗНАКОМСТВО
      </p>
      <form
        ref={form}
        onSubmit={submit}
        className={
          status === "success" ? "contact-form has-success" : "contact-form"
        }
      >
        <div className="field-pair">
          <label>
            Как к вам обращаться
            <input
              name="name"
              autoComplete="name"
              placeholder="Ваше имя"
              required
              minLength={2}
              maxLength={100}
              disabled={status === "success"}
            />
          </label>
          <label>
            Как с вами связаться
            <input
              name="contact"
              autoComplete="email"
              placeholder="Телефон, email или Telegram"
              required
              minLength={5}
              maxLength={160}
              disabled={status === "success"}
            />
          </label>
        </div>
        <label>
          Какое пространство вы создаёте?
          <select
            name="type"
            defaultValue=""
            required
            disabled={status === "success"}
          >
            <option value="" disabled>
              Выберите тип объекта
            </option>
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.category}
              </option>
            ))}
            <option value="other">Другое пространство</option>
          </select>
        </label>
        <label>
          Несколько слов о вашем проекте
          <textarea
            name="description"
            placeholder="Что вы планируете? Где находится объект?"
            rows={3}
            required
            minLength={10}
            maxLength={4000}
            disabled={status === "success"}
          />
        </label>
        <div className="file-field">
          <input
            ref={upload}
            type="file"
            className="visually-hidden"
            aria-label="Прикрепить планировку"
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={status === "success"}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected && selected.size > 5 * 1024 * 1024) {
                setMessage("Размер файла — не более 5 МБ.");
                setStatus("error");
                event.target.value = "";
                return;
              }
              setFile(selected ?? null);
              setMessage("");
              setStatus("idle");
            }}
          />
          <button
            type="button"
            onClick={() => upload.current?.click()}
            disabled={status === "success"}
          >
            <Paperclip size={16} />
            {file ? file.name : "Прикрепить планировку или ТЗ"}
          </button>
          {file ? (
            <button
              type="button"
              aria-label="Удалить вложение"
              disabled={status === "success"}
              onClick={() => {
                setFile(null);
                if (upload.current) upload.current.value = "";
              }}
            >
              <X size={15} />
            </button>
          ) : (
            <small>PDF, JPG, PNG · до 5 МБ</small>
          )}
        </div>
        <div className="honeypot" aria-hidden="true">
          <label>
            Ваш сайт
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="consent">
          <input
            type="checkbox"
            name="consent"
            value="yes"
            required
            disabled={status === "success"}
          />
          <span>
            Согласен на{" "}
            <Link href="/privacy" target="_blank">
              обработку данных
            </Link>{" "}
            для подготовки брифа
          </span>
        </label>
        {status !== "success" && (
          <button
            type="submit"
            className="button button-copper form-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? (
              <>
                Сохраняем бриф <LoaderCircle className="spin" size={20} />
              </>
            ) : (
              <>
                Обсудить объект <ArrowUpRight size={21} strokeWidth={1.1} />
              </>
            )}
          </button>
        )}
        <div aria-live="polite" role="status">
          {message && <p className="form-error">{message}</p>}
          {status === "success" && (
            <div className="form-success">
              <Check size={23} />
              <div>
                <strong>Бриф сохранён.</strong>
                <p>
                  Это демонстрационная форма: данные сохранены в этом экземпляре
                  сайта, но не отправлены компании.
                </p>
                <button type="button" onClick={downloadBrief}>
                  Скачать свой бриф ↗
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="form-disclaimer">
          Демонстрационный режим. Бриф сохраняется на сайте и не отправляется
          компании. Не указывайте конфиденциальные данные.
        </p>
      </form>
    </div>
  );
}
