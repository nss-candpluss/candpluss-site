import type { OpenCloseGroupId } from "@/types/product";

const GROUPS = ["open", "close"] as const satisfies readonly OpenCloseGroupId[];

type ProductGalleryOpenCloseProps = {
  activeGroupId: OpenCloseGroupId;
  onChange: (groupId: OpenCloseGroupId) => void;
};

export function ProductGalleryOpenClose({
  activeGroupId,
  onChange,
}: ProductGalleryOpenCloseProps) {
  const activeIndex = activeGroupId === "open" ? 0 : 1;

  return (
    <div className="absolute bottom-[3vh] left-1/2 z-10 grid -translate-x-1/2 grid-cols-2 rounded-full bg-white/90 px-[5px] py-[5px] min-[1025px]:bottom-[6vh]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[5px] bottom-[5px] left-[5px] w-[calc((100%-10px)/2)] rounded-full bg-[var(--foreground)] transition-transform duration-300 ease-out"
        style={{
          transform: activeIndex === 0 ? "translateX(0)" : "translateX(100%)",
        }}
      />

      {GROUPS.map((groupId) => {
        const isActive = activeGroupId === groupId;
        const label = groupId === "open" ? "OPEN" : "CLOSE";

        return (
          <button
            key={groupId}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(groupId)}
            className={`relative z-10 min-w-[72px] px-[16px] py-[8px] text-[14px] leading-[14px] font-ui-en ${
              isActive ? "text-white" : "text-[var(--color-muted)]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
