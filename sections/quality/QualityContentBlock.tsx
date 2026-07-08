import { bodyText, sectionTitle62ClassName } from "@/lib/typography";

type QualitySectionTitleProps = {
  title: string;
};

type QualityItemContentProps = {
  subtitle: string;
  body: string;
};

export function QualitySectionTitle({ title }: QualitySectionTitleProps) {
  return (
    <h2 className={`quality-section-title shrink-0 font-heading ${sectionTitle62ClassName}`}>{title}</h2>
  );
}

/** Materials / Design 各項目のサブタイトル（大見出しは sectionTitle62ClassName のまま） */
const qualityItemSubtitleClassName =
  "text-[calc(20px*var(--text-scale))] leading-[calc(25px*var(--text-scale))]";

export function QualityItemContent({ subtitle, body }: QualityItemContentProps) {
  return (
    <div className="quality-item-content">
      <p className={`quality-item-subtitle font-body-ja font-semibold ${qualityItemSubtitleClassName}`}>
        {subtitle}
      </p>

      <p
        className={`quality-item-body mt-[calc(32px*var(--gap-scale-y))] whitespace-pre-line font-body-ja ${bodyText(18)}`}
      >
        {body}
      </p>
    </div>
  );
}

/** Section Title ヘッダー余白（descender 分の pb を含む） */
export const qualitySectionTitleHeaderClassName =
  "quality-section-title-header px-[var(--container-x)] pt-[var(--container-y-top)] pb-[calc(12px*var(--text-scale))] text-[var(--foreground)]";

/** 1023px 以下: サブタイトル・本文エリアの左右余白（大見出し Materials / Design は除く） */
export const qualityItemContentPaddingClassName =
  "px-[10vw] min-[1024px]:px-[var(--container-x)]";
