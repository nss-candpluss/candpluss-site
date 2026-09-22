import { scrollBoundLenisTo } from "@/lib/motion/setup-lenis-scroll-trigger";

export function scrollToPageTop(): void {
  if (window.location.hash) {
    const oldURL = window.location.href;

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );

    // replaceState では hashchange が出ない。ハッシュで表示を切り替えている
    // 画面（商品一覧のカテゴリ）が取り残されないよう、自分で知らせる。
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL,
        newURL: window.location.href,
      })
    );
  }

  if (!scrollBoundLenisTo(0)) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
