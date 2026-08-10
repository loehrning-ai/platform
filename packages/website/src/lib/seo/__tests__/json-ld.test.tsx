import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL, WEBSITE_ID } from "../json-ld";

describe("JsonLd primitive", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "test",
    } as const;
    const { container } = render(<JsonLd data={data} id="t1" />);
    const script = container.querySelector("script#t1");
    expect(script).not.toBeNull();
    expect(script?.getAttribute("type")).toBe("application/ld+json");
  });

  it("serialises the payload to JSON", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "Tim",
    } as const;
    const { container } = render(<JsonLd data={data} id="t2" />);
    const script = container.querySelector("script#t2");
    expect(script?.innerHTML).toBeDefined();
    const parsed = JSON.parse(script?.innerHTML ?? "{}");
    expect(parsed.name).toBe("Tim");
  });

  it("cannot be terminated by HTML-significant editorial text", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "</script><script>alert('xss')</script>&",
    } as const;
    const { container } = render(<JsonLd data={data} id="safe-jsonld" />);
    const script = container.querySelector("script#safe-jsonld");
    const source = script?.innerHTML ?? "";
    expect(source).not.toContain("</script>");
    expect(source).toContain("\\u003c");
    expect(JSON.parse(source).name).toBe(data.name);
    expect(container.querySelectorAll("script")).toHaveLength(1);
  });

  it("escapes every script-sensitive character without changing the JSON value", () => {
    const value = "<>&\u2028\u2029</script>";
    const data = {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: value,
    } as const;
    const { container } = render(<JsonLd data={data} id="escaped-jsonld" />);
    const source =
      container.querySelector("script#escaped-jsonld")?.innerHTML ?? "";

    expect(source).not.toMatch(/[<>&\u2028\u2029]/u);
    expect(source).toContain("\\u003c");
    expect(source).toContain("\\u003e");
    expect(source).toContain("\\u0026");
    expect(source).toContain("\\u2028");
    expect(source).toContain("\\u2029");
    expect(JSON.parse(source).name).toBe(value);
  });

  it("exports stable @id constants pointing at loehrning.ai", () => {
    expect(SITE_URL).toBe("https://loehrning.ai");
    expect(ORG_ID).toBe("https://loehrning.ai/#org");
    expect(PERSON_ID).toBe("https://loehrning.ai/#tim");
    expect(WEBSITE_ID).toBe("https://loehrning.ai/#website");
  });
});
