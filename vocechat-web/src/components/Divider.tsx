import { FC } from "react";
import clsx from "clsx";

interface Props {
  content: string;
  className?: string;
}

const Divider: FC<Props> = ({ content, className = "" }) => {
  return (
    <div
      className={clsx(
        "or relative border-none h-px bg-bg-surface/60 my-4 overflow-visible",
        className
      )}
    >
      <span className="px-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-fg-muted font-mono bg-bg-canvas"
        style={{ fontSize: "0.7rem", letterSpacing: "0.04em" }}
      >
        {content}
      </span>
    </div>
  );
};

export default Divider;
