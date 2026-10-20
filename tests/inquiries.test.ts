import { test } from "node:test";
import assert from "node:assert/strict";
import { attachmentExtension, validateInquiry } from "../src/lib/inquiries";

const valid = {
  name: "Тестовый посетитель",
  contact: "test@example.com",
  type: "restaurant",
  description: "Тестовая задача для проверки формы.",
  consent: "yes",
};

test("contacts accept email, telephone and Telegram", () => {
  for (const contact of [
    "test@example.com",
    "+7 (900) 000-00-00",
    "@test_contact",
    "https://t.me/test_contact",
  ])
    assert.ok("value" in validateInquiry({ ...valid, contact }));
});

test("malformed contacts and missing consent are rejected", () => {
  for (const contact of ["hello", "no@email", "123", "https://untrusted.test"])
    assert.ok("error" in validateInquiry({ ...valid, contact }));
  assert.ok("error" in validateInquiry({ ...valid, consent: null }));
  assert.ok("error" in validateInquiry({ ...valid, type: "unexpected" }));
  assert.ok("error" in validateInquiry({ ...valid, name: "  " }));
  assert.ok("error" in validateInquiry({ ...valid, description: "  short  " }));
  assert.ok("error" in validateInquiry({ ...valid, website: "spam.example" }));
});

test("attachment classification uses magic bytes, not the supplied filename", () => {
  assert.equal(attachmentExtension(Buffer.from("%PDF-1.7")), "pdf");
  assert.equal(
    attachmentExtension(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
    "jpg",
  );
  assert.equal(
    attachmentExtension(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "png",
  );
  assert.equal(
    attachmentExtension(Buffer.from("<script>alert(1)</script>")),
    null,
  );
});
