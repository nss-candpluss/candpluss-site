import { describe, expect, it } from "vitest";

import { bodyText, uiText, uiTextRange } from "@/lib/typography";

describe("11–20px text-scale floors", () => {
  it("fixes 11px and floors 12–20px UI sizes", () => {
    expect(uiText(11)).toBe("text-[11px] leading-[11px]");
    expect(uiText(12)).toBe(uiTextRange("11-12"));
    expect(uiText(13)).toBe(uiTextRange("12-13"));
    expect(uiText(14)).toBe(uiTextRange("13-14"));
    expect(uiText(15)).toBe(uiTextRange("14-15"));
    expect(uiText(16)).toBe(uiTextRange("15-16"));
    expect(uiText(18)).toBe(uiTextRange("16-18"));
    expect(uiText(20)).toBe(uiTextRange("18-20"));
  });

  it("floors body font-size without changing the 1.75 leading formula", () => {
    expect(bodyText(14)).toBe(
      "text-[clamp(13px,calc(14px*var(--text-scale)),14px)] leading-[calc(24.5px*var(--text-scale))]"
    );
    expect(bodyText(15)).toBe(
      "text-[clamp(14px,calc(15px*var(--text-scale)),15px)] leading-[calc(26.25px*var(--text-scale))]"
    );
    expect(bodyText(16)).toBe(
      "text-[clamp(15px,calc(16px*var(--text-scale)),16px)] leading-[calc(28px*var(--text-scale))]"
    );
    expect(bodyText(18)).toBe(
      "text-[clamp(16px,calc(18px*var(--text-scale)),18px)] leading-[calc(31.5px*var(--text-scale))]"
    );
    expect(bodyText(20)).toBe(
      "text-[clamp(18px,calc(20px*var(--text-scale)),20px)] leading-[calc(35px*var(--text-scale))]"
    );
  });
});
