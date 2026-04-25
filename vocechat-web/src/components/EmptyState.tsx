import { FC, ReactNode } from "react";
import clsx from "clsx";

type Props = {
  icon?: ReactNode;
  title: string;
  desc?: string;
  className?: string;
};

/**
 * 通用空狀態畫面：垂直水平置中，桌機 / 手機共用。
 * 用法：放在 flex-1 / 撐滿父容器的位置，自己會置中。
 */
const EmptyState: FC<Props> = ({ icon, title, desc, className }) => {
  return (
    <div
      className={clsx(
        "w-full flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-bg-surface flex-center text-fg-subtle">
          {icon}
        </div>
      )}
      <div className="text-sm font-medium text-fg-secondary">{title}</div>
      {desc && <div className="text-xs text-fg-muted max-w-xs">{desc}</div>}
    </div>
  );
};

export default EmptyState;
