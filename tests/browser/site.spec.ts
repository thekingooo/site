import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

test("3D scene completes all states and reverses; engineering layers respond", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".model-stage")).toHaveClass(/is-ready/);
  await expect(page.locator("canvas")).toBeVisible();
  // Software WebGL in CI: exercise the same geometry and timeline with a
  // smaller render target. HQ is inspected separately on desktop.
  const hq = page.getByRole("button", { name: "HQ", exact: true });
  if (await hq.count()) await hq.click();
  await expect(
    page.getByRole("button", { name: "Эко", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const scenes = ["restaurant", "retail", "office", "bank", "clinic"];
  let firstFrame: Buffer | undefined;
  let lastFrame: Buffer | undefined;
  for (let i = 0; i < scenes.length; i++) {
    await page.locator(".scene-navigation button").nth(i).click();
    await expect(page.locator(".experience")).toHaveAttribute(
      "data-scene",
      scenes[i],
    );
    await expect
      .poll(async () =>
        Number(await page.locator(".experience").getAttribute("data-progress")),
      )
      .toBeCloseTo(i / 4, 2);
    await expect
      .poll(async () =>
        Number(await page.locator("canvas").getAttribute("data-rotation")),
      )
      .toBeCloseTo(-i * Math.PI * 2, 2);
    if (i === 0) firstFrame = await page.locator("canvas").screenshot();
    if (i === 4) lastFrame = await page.locator("canvas").screenshot();
  }
  expect(firstFrame!.equals(lastFrame!)).toBe(false);
  await page.locator(".scene-navigation button").first().click();
  await expect(page.locator(".experience")).toHaveAttribute(
    "data-scene",
    "restaurant",
  );
  await expect
    .poll(async () =>
      Number(await page.locator(".experience").getAttribute("data-progress")),
    )
    .toBeCloseTo(0, 2);
  const button = page.getByRole("button", { name: /Разобрать объект/ });
  await button.click();
  await expect(
    page.getByRole("button", { name: /Собрать объект/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("project filters, project page and service details work", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page
    .getByRole("navigation", { name: "Фильтр проектов" })
    .getByRole("button", { name: "Клиники", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.locator(".project-card").click();
  await expect(page).toHaveURL("/projects/clinic");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Спокойствие внутри",
  );
  await expect(
    page.getByText("Концепция · Не реализованный объект"),
  ).toBeVisible();
  await page.goto("/services/engineering");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Инженерные системы",
  );
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Вентиляция и кондиционирование" }),
  ).toBeVisible();
});

test("form validates, stores a brief and attachment, and downloads it honestly", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByLabel("Как к вам обращаться").fill("Тест формы");
  await page.getByLabel("Как с вами связаться").fill("test@example.com");
  await page
    .getByLabel("Какое пространство вы создаёте?")
    .selectOption("office");
  await page
    .getByLabel("Несколько слов о вашем проекте")
    .fill("Тестовый бриф для проверки работы сайта.");
  await page
    .getByLabel("Прикрепить планировку", { exact: true })
    .setInputFiles({
      name: "plan.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\nTest attachment\n%%EOF"),
    });
  await page.locator("input[name=consent]").check();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/inquiries") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Обсудить объект", exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const result = await response.json();
  await expect(page.getByText("Бриф сохранён.", { exact: true })).toBeVisible();
  const directory = path.join(process.cwd(), ".data", "inquiries", result.id);
  try {
    const brief = JSON.parse(
      await fs.readFile(path.join(directory, "brief.json"), "utf8"),
    );
    expect(brief.contact).toBe("test@example.com");
    expect(brief.deliveredToCompany).toBe(false);
    expect(
      await fs.readFile(path.join(directory, "attachment.pdf"), "utf8"),
    ).toContain("%PDF-");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Скачать свой бриф" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("prostranstvo-brief.txt");
    const downloaded = await download.path();
    const text = await fs.readFile(downloaded!, "utf8");
    expect(text).toContain("Тест формы");
    expect(text).toContain("test@example.com");
    expect(text).toContain("Тестовый бриф для проверки работы сайта.");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("server rejects malformed contacts, missing consent and executable uploads", async ({
  request,
}) => {
  const valid = {
    name: "Тест",
    contact: "test@example.com",
    type: "bank",
    description: "Тестовая задача банка.",
    consent: "yes",
  };
  for (const fields of [
    { ...valid, contact: "invalid" },
    { ...valid, consent: "" },
  ]) {
    const response = await request.post("/api/inquiries", {
      multipart: fields,
    });
    expect(response.status()).toBe(400);
  }
  const executable = await request.post("/api/inquiries", {
    multipart: {
      ...valid,
      attachment: {
        name: "fake.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("<script>bad</script>"),
      },
    },
  });
  expect(executable.status()).toBe(400);
  const foreign = await request.post("/api/inquiries", {
    headers: { origin: "https://untrusted.example" },
    multipart: valid,
  });
  expect(foreign.status()).toBe(403);
});

test("mobile layout, menu and reduced motion remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".model-stage")).toHaveClass(/is-ready/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(page.locator("#main-navigation")).toBeVisible();
  await page
    .locator("#main-navigation")
    .getByRole("link", { name: "Услуги", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.goto("/");
  await page.locator(".scene-navigation button").nth(4).click();
  await expect(page.locator(".experience")).toHaveAttribute(
    "data-scene",
    "clinic",
  );
});

test("WebGL failure displays navigable image fallbacks", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".model-fallback img")).toBeVisible();
  await page.locator(".scene-navigation button").nth(1).click();
  await expect(page.locator(".model-fallback img")).toHaveAttribute(
    "src",
    "/images/retail.jpg",
  );
});

test("new office GLBs support direct navigation and reference comparison", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?space=office");
  await expect(page.locator(".experience")).toHaveAttribute(
    "data-scene",
    "office",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-geometry",
    "blender-office",
  );
  await page.goto("/model-review");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-geometry",
    "blender-office",
  );
  const hq = page.getByRole("button", { name: "HQ", exact: true });
  if (await hq.count()) await hq.click();
  await expect(
    page.getByRole("button", { name: "Эко", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Раздвинуть слои" }).click();
  await expect(
    page.getByRole("button", { name: "Собрать слои" }),
  ).toHaveAttribute("aria-pressed", "true");
  const canvas = page.locator("canvas");
  const before = await canvas.screenshot();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Missing 3D canvas");
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.55, {
    steps: 12,
  });
  await page.mouse.up();
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
  await page
    .getByLabel("Открыть референс", { exact: true })
    .setInputFiles("public/images/office-model-review.jpg");
  await expect(page.getByAltText("Загруженный вами референс")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  expect(errors).toEqual([]);
});
