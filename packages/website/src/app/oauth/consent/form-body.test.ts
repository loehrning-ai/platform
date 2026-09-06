import { describe, expect, it } from "vitest";
import { hasFormContentType, readBoundedForm } from "./form-body";

function formRequest(
  body: string | ReadableStream<Uint8Array> | null,
  headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  },
): Request {
  return new Request("https://loehrning.ai/oauth/consent/entscheidung", {
    method: "POST",
    headers,
    body,
    ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit);
}

describe("hasFormContentType", () => {
  it("accepts the URL-encoded form type with a charset parameter", () => {
    expect(
      hasFormContentType(
        formRequest("a=1", {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ["JSON", "application/json"],
    ["multipart", "multipart/form-data; boundary=x"],
    ["plain text", "text/plain"],
  ])("rejects %s", (_label, contentType) => {
    expect(
      hasFormContentType(formRequest("a=1", { "Content-Type": contentType })),
    ).toBe(false);
  });

  it("rejects a request without a content type", () => {
    expect(hasFormContentType(formRequest("a=1", {}))).toBe(false);
  });
});

describe("readBoundedForm", () => {
  it("parses the fields the consent form submits", async () => {
    const result = await readBoundedForm(
      formRequest("authorization_id=abc&entscheidung=zustimmen&sprache=de"),
      2_048,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.get("authorization_id")).toBe("abc");
    expect(result.value.get("entscheidung")).toBe("zustimmen");
    expect(result.value.get("sprache")).toBe("de");
  });

  it("rejects a declared length above the cap without reading the body", async () => {
    const request = formRequest("a=1", {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": "999999",
    });

    expect(await readBoundedForm(request, 2_048)).toEqual({
      ok: false,
      error: "body_too_large",
    });
    expect(request.bodyUsed).toBe(false);
  });

  it("stops a body that exceeds the cap while streaming, despite a lying header", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("a=".padEnd(4_096, "x")));
        controller.close();
      },
    });

    expect(await readBoundedForm(formRequest(stream), 2_048)).toEqual({
      ok: false,
      error: "body_too_large",
    });
  });

  it("reports a request without a body", async () => {
    expect(await readBoundedForm(formRequest(null), 2_048)).toEqual({
      ok: false,
      error: "invalid_form",
    });
  });

  it("reports a stream that fails mid-read", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });

    expect(await readBoundedForm(formRequest(stream), 2_048)).toEqual({
      ok: false,
      error: "invalid_form",
    });
  });

  it("refuses a cap that is not a positive safe integer", async () => {
    await expect(readBoundedForm(formRequest("a=1"), 0)).rejects.toThrow(
      TypeError,
    );
    await expect(readBoundedForm(formRequest("a=1"), 1.5)).rejects.toThrow(
      TypeError,
    );
  });
});
