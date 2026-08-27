import { describe, expect, it } from "vitest";

import {
  SITE_LOADER_BOOTSTRAP,
  SITE_LOADER_QUERY,
  SITE_LOADER_STORAGE_KEY,
} from "@/lib/site-loader";

describe("site loader bootstrap", () => {
  it("writes pending unless the session has already seen the intro", () => {
    expect(SITE_LOADER_BOOTSTRAP).toContain(SITE_LOADER_STORAGE_KEY);
    expect(SITE_LOADER_BOOTSTRAP).toContain(`q.get("${SITE_LOADER_QUERY}")==="1"`);
    expect(SITE_LOADER_BOOTSTRAP).toContain('dataset.loader="pending"');
    expect(SITE_LOADER_BOOTSTRAP).toContain('dataset.loader="done"');
  });
});
