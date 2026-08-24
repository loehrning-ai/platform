import { describe, expect, it } from "vitest";
import { NO_SCRIPT_FALLBACK_CSS } from "./no-script";

describe("no-script accessibility fallback", () => {
  it("reveals opted-in motion content and the static mobile navigation", () => {
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      ".js-reveal{opacity:1!important",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain("transform:none!important");
    expect(NO_SCRIPT_FALLBACK_CSS).toContain("clip-path:none!important");
    expect(NO_SCRIPT_FALLBACK_CSS).toContain("visibility:visible!important");
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      ".no-js-mobile-nav{display:block!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      ".js-mobile-nav-toggle{display:none!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      ".js-desktop-nav{display:none!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      ".no-js-primary-nav{position:static!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      "[data-learning-owner-panel]{display:none!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).toContain(
      "#main-content{padding-top:0!important}",
    );
    expect(NO_SCRIPT_FALLBACK_CSS).not.toContain(
      "@media(max-width:63.999rem)",
    );
  });
});
