const preloadedSources = new Set<string>();

export function isImagePreloaded(src: string): boolean {
  return preloadedSources.has(src);
}

export function preloadImage(src: string): Promise<void> {
  if (preloadedSources.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      preloadedSources.add(src);
      resolve();
    };
    image.onerror = () => {
      reject(new Error(`Failed to preload image: ${src}`));
    };
    image.src = src;
  });
}

export function scheduleIdleTask(callback: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 5000 });
    return;
  }

  window.setTimeout(callback, 200);
}

export async function preloadImagesSequentially(sources: string[]): Promise<void> {
  for (const src of sources) {
    try {
      await preloadImage(src);
    } catch {
      // 1枚失敗しても残りは続行
    }
  }
}
