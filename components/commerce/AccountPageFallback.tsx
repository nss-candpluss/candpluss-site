/**
 * 会員まわりのページを待っている間に出す場所取り。
 *
 * これらのページはログイン状態をサーバーで見てから中身が決まるので、
 * 届くまでの一瞬、中身のない状態で描かれる。置き換えるものが無いと
 * ヘッダーとフッターがくっついて、画面が一度潰れて見える。
 *
 * 出来上がりと同じ余白と高さを先に取っておき、中身だけを差し替える。
 * 目に見える文字は置かない。数百ミリ秒で消えるものが出入りすると、
 * それ自体がちらつきになる。読み上げには聞こえるようにしておく。
 */
export function AccountPageFallback() {
  return (
    <main
      data-header-theme="onLight"
      className="min-h-svh px-[var(--container-x)] pt-[calc(var(--header-height)+var(--container-y-top))] pb-[var(--container-y-bottom)]"
    >
      <p role="status" className="sr-only">
        読み込み中
      </p>
    </main>
  );
}
