import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sizeSpecSource = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../components/products/ProductSizeSpec.tsx"
  ),
  "utf8"
);

describe("ProductSizeSpec resource links", () => {
  it("shows the fixed manual label with the arrow icon when configured", () => {
    expect(sizeSpecSource).toContain("sizeSpec.manualHref ?");
    expect(sizeSpecSource).toContain('label="取扱説明書DL"');
    expect(sizeSpecSource).toContain("iconStyle={arrowMaskStyle}");
  });

  it("shows the setup-video label with the YouTube icon when configured", () => {
    expect(sizeSpecSource).toContain("sizeSpec.setupVideoHref ?");
    expect(sizeSpecSource).toContain('label="設営動画"');
    expect(sizeSpecSource).toContain(
      '"/assets/icons/icon-sns-youtube.svg"'
    );
    expect(sizeSpecSource).toContain("iconStyle={youtubeMaskStyle}");
  });

  it("shows the teardown video below the setup video with the YouTube icon", () => {
    const setupVideoPosition = sizeSpecSource.indexOf('label="設営動画"');
    const teardownVideoPosition = sizeSpecSource.indexOf('label="撤収動画"');

    expect(sizeSpecSource).toContain("sizeSpec.teardownVideoHref ?");
    expect(teardownVideoPosition).toBeGreaterThan(setupVideoPosition);
    expect(sizeSpecSource).toContain("href={sizeSpec.teardownVideoHref}");
  });

  it("opens every resource link type safely in a new tab", () => {
    expect(sizeSpecSource).toContain('target="_blank"');
    expect(sizeSpecSource).toContain('rel="noopener noreferrer"');
  });

  it("matches Feature links typography and static underline treatment", () => {
    expect(sizeSpecSource).toContain(
      "font-body-ja font-semibold text-[var(--foreground)] ${uiText(15)}"
    );
    expect(sizeSpecSource).toContain(
      "underline decoration-1 underline-offset-[1px]"
    );
    expect(sizeSpecSource).not.toContain("HoverUnderlineText");
    expect(sizeSpecSource).not.toContain("groupHover");
  });
});
