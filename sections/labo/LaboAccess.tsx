import { Container } from "@/components/ui/Container";
import { laboAccessContent, laboContent } from "@/data/labo";
import { assetPath } from "@/lib/assetPath";
import { bodyText, uiText } from "@/lib/typography";

export function LaboAccess() {
  const { number, titleWrapSegments, label, address, details, map } =
    laboAccessContent;
  const [hours, holiday, parking] = details;

  return (
    <section
      data-header-theme="onLight"
      data-labo-access
      className="relative overflow-hidden bg-[#f5f5f5] pt-[var(--container-y-top)] pb-[clamp(82px,calc(82px+(100vw-390px)/(1920px-390px)*102px),184px)] text-[var(--foreground)]"
    >
      <Container>
        <div className="grid grid-cols-1 gap-y-0 min-[1025px]:grid-cols-2 min-[1025px]:grid-rows-[auto_1fr] min-[1025px]:items-stretch min-[1025px]:gap-x-[calc(52px*var(--gap-scale-x))]">
          <div className="order-1 min-[1025px]:col-start-1 min-[1025px]:row-start-1">
            <h2 className={`font-heading ${uiText(48)}`}>
              <span className="concept-heading-numeral mb-[clamp(16px,calc(20px*var(--gap-scale-y)),20px)] block">
                {number}
              </span>
              <span className="flex flex-wrap gap-x-0 gap-y-[0.2em]">
                {titleWrapSegments.map((segment) => (
                  <span key={segment} className="whitespace-nowrap">
                    {segment}
                  </span>
                ))}
              </span>
            </h2>
            <p
              className={`mt-[clamp(10px,calc(16px*var(--gap-scale-y)),16px)] font-ui-en font-medium opacity-[0.65] ${uiText(18)}`}
            >
              {label}
            </p>
          </div>

          <figure className="relative order-2 mt-[calc(98px*var(--layout-scale-y))] aspect-[13/10] overflow-hidden min-[1025px]:absolute min-[1025px]:inset-y-0 min-[1025px]:right-0 min-[1025px]:order-none min-[1025px]:col-start-2 min-[1025px]:row-start-1 min-[1025px]:row-span-2 min-[1025px]:mt-0 min-[1025px]:aspect-auto min-[1025px]:h-auto min-[1025px]:w-[calc(50%-calc(52px*var(--gap-scale-x))/2)]">
            <iframe
              src={map.src}
              title={map.title}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 grayscale contrast-[1.08]"
              allowFullScreen
            />
          </figure>

          <div
            className={`order-3 mt-[clamp(38px,calc(72px*var(--gap-scale-y)),72px)] min-[1025px]:col-start-1 min-[1025px]:row-start-2 ${bodyText(16)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(laboContent.hero.titleLogo)}
              alt={laboContent.hero.title}
              className="block h-auto w-[min(100%,calc(1.2em*814.088/72.001))]"
            />
            <p className="mt-[1.2em] mb-[0.5em] font-body-ja">
              <span className="whitespace-nowrap">{address.postal}</span>{" "}
              <span className="whitespace-nowrap">{address.street}</span>
            </p>
            <p className="font-body-ja">
              <span className="whitespace-nowrap">
                <span className="font-semibold text-[var(--color-muted)]">
                  {hours?.label}
                </span>
                ：{hours?.value}
              </span>
              {"　"}
              <span className="whitespace-nowrap">
                <span className="font-semibold text-[var(--color-muted)]">
                  {holiday?.label}
                </span>
                ：{holiday?.value}
              </span>
            </p>
            <p className="font-body-ja">
              <span className="whitespace-nowrap">
                <span className="font-semibold text-[var(--color-muted)]">
                  {parking?.label}
                </span>
                ：{parking?.value}
              </span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
