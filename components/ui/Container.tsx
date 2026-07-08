import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`w-full px-[var(--container-x)] ${className}`.trim()}>
      {children}
    </div>
  );
}
