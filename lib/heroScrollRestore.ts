const LAST_PATHNAME_KEY = "hero:last-pathname";
const SCROLL_SNAPSHOT_KEY = "hero:scroll-snapshot";
const PENDING_RETURN_KEY = "hero:pending-return";

export type HeroScrollSnapshot = {
  scrollY: number;
  progress: number;
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function writeHeroLastPathname(pathname: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.setItem(LAST_PATHNAME_KEY, pathname);
}

export function readHeroLastPathname() {
  if (!canUseSessionStorage()) {
    return null;
  }

  return sessionStorage.getItem(LAST_PATHNAME_KEY);
}

export function markHeroPendingReturn() {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.setItem(PENDING_RETURN_KEY, "1");
}

export function consumeHeroPendingReturn() {
  if (!canUseSessionStorage()) {
    return false;
  }

  const pending = sessionStorage.getItem(PENDING_RETURN_KEY) === "1";
  sessionStorage.removeItem(PENDING_RETURN_KEY);
  return pending;
}

export function isHeroPendingReturn() {
  if (!canUseSessionStorage()) {
    return false;
  }

  return sessionStorage.getItem(PENDING_RETURN_KEY) === "1";
}

export function clearHeroPendingReturn() {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.removeItem(PENDING_RETURN_KEY);
}

export function writeHeroScrollSnapshot(scrollY: number, progress: number) {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.setItem(
    SCROLL_SNAPSHOT_KEY,
    JSON.stringify({ scrollY, progress })
  );
}

export function readHeroScrollSnapshot(): HeroScrollSnapshot | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = sessionStorage.getItem(SCROLL_SNAPSHOT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as HeroScrollSnapshot;
    if (
      typeof parsed.scrollY === "number" &&
      typeof parsed.progress === "number"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearHeroScrollSnapshot() {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.removeItem(SCROLL_SNAPSHOT_KEY);
}
