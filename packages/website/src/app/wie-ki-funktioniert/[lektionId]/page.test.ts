import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WIE_KI_LEKTIONEN } from "@/lib/wie-ki-funktioniert";
import LektionPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";

describe("/wie-ki-funktioniert/[lektionId] static route contract", () => {
  it("prerenders every reviewed lesson and rejects unknown on-demand slugs", async () => {
    expect(dynamicParams).toBe(false);
    expect(await generateStaticParams()).toEqual(
      WIE_KI_LEKTIONEN.map(({ id }) => ({ lektionId: id })),
    );
  });

  it("does not emit indexable metadata for an unknown lesson", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({
          lektionId: "diese-lektion-gibt-es-nicht",
        }),
      }),
    ).resolves.toEqual({});
  });

  it("uses descriptive breadcrumb link text for the homepage", async () => {
    render(
      await LektionPage({
        params: Promise.resolve({ lektionId: "lektion-1-vorhersage" }),
      }),
    );
    expect(screen.getByRole("link", { name: "Startseite" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Start" })).not.toBeInTheDocument();
  });
});
