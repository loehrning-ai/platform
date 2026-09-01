/** @vitest-environment node */

import sharp from "sharp";
import { describe, expect, it } from "vitest";
import Image, {
  alt,
  contentType,
  runtime,
  size,
} from "./opengraph-image";

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const COPPER = [183, 58, 21] as const;

describe("root social image", () => {
  it("renders a logo-led card that remains readable at thumbnail size", async () => {
    const response = Image();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");

    const bytes = Buffer.from(await response.arrayBuffer());
    expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(bytes.readUInt32BE(16)).toBe(size.width);
    expect(bytes.readUInt32BE(20)).toBe(size.height);

    const { data, info } = await sharp(bytes)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let copperPixels = 0;
    for (let offset = 0; offset < data.length; offset += info.channels) {
      if (
        data[offset] === COPPER[0] &&
        data[offset + 1] === COPPER[1] &&
        data[offset + 2] === COPPER[2]
      ) {
        copperPixels += 1;
      }
    }

    // The giant Ö contributes over 60k solid copper pixels. The previous
    // corner logo occupied only a small fraction of that area.
    expect(copperPixels).toBeGreaterThan(60_000);
  });

  it("keeps metadata aligned with the rendered subject", () => {
    expect(runtime).toBe("edge");
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toBe(
      "Large copper Ö logo above the loehrning.ai wordmark on a warm cream background.",
    );
  });
});
