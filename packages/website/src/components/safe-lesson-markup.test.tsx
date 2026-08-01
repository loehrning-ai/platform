import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeLessonMarkup } from "./safe-lesson-markup";

describe("SafeLessonMarkup", () => {
  it("preserves the lesson formatting vocabulary and decodes text entities", () => {
    const { container } = render(
      <SafeLessonMarkup
        html={
          '<p><strong>Safe</strong> <em>emphasis</em><br><code>&lt;DATEID&gt;</code></p>' +
          '<pre>GET /items?x=1&amp;y=2</pre><span class="accent chip">highlight</span>'
        }
      />,
    );

    expect(container.querySelector("p strong")).toHaveTextContent("Safe");
    expect(container.querySelector("p em")).toHaveTextContent("emphasis");
    expect(container.querySelector("p br")).not.toBeNull();
    expect(container.querySelector("code")).toHaveTextContent("<DATEID>");
    expect(container.querySelector("pre")).toHaveTextContent("GET /items?x=1&y=2");
    expect(screen.getByText("highlight")).toHaveClass("accent", "chip");
  });

  it("drops executable elements, unknown elements, attributes, and non-allowlisted classes", () => {
    const { container } = render(
      <SafeLessonMarkup
        html={
          '<script>alert("script")</script>' +
          '<style>body{display:none}</style>' +
          '<svg><script>alert("svg")</script></svg>' +
          '<img src=x onerror="alert(1)">' +
          '<a href="javascript:alert(1)">plain text</a>' +
          '<strong onclick="alert(1)" style="display:none">visible</strong>' +
          '<span class="accent attacker" onmouseover="alert(1)">accented</span>'
        }
      />,
    );

    expect(container.querySelector("script, style, svg, img, a")).toBeNull();
    expect(container.querySelector("[onclick], [onmouseover], [style], [href]")).toBeNull();
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    expect(screen.getByText("plain text")).toBeInTheDocument();
    expect(screen.getByText("visible")).toBeVisible();
    expect(screen.getByText("accented")).toHaveClass("accent");
    expect(screen.getByText("accented")).not.toHaveClass("attacker");
  });

  it("keeps encoded markup inert instead of reparsing it as HTML", () => {
    const { container } = render(
      <div data-testid="output">
        <SafeLessonMarkup html={'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'} />
      </div>,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("output").textContent).toBe('<img src=x onerror="alert(1)">');
  });
});
