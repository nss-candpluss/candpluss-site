type ProductComingSoonBadgeProps = {
  className?: string;
};

/**
 * 購入停止中に商品名の下（一覧では販売開始日の上）に出すラベル。
 * 枠線の形は一覧の NEW バッジに合わせる。
 */
export function ProductComingSoonBadge({
  className = "",
}: ProductComingSoonBadgeProps) {
  return (
    <p
      className={`inline-flex h-[1.5em] items-center justify-center rounded-[4px] border border-[#c40000] px-[0.45em] font-ui-en text-[#c40000] !leading-none ${className}`.trim()}
    >
      {/* 大文字だけでディセンダが無いため、行ボックスを中央寄せしても字面は枠の中心より上に出る。
          Inter の実測（枠内 16px に対し上 3.15px / 下 3.85px）から、字面の中心を枠の中心に合わせる */}
      <span className="block translate-y-[0.03em]">COMING SOON</span>
    </p>
  );
}
