import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode };
const StyledButton = ({ children, className = "", ...rest }: Props) => {
  const isGhost = className.includes("ghost");
  const noBorder = className.includes("border_less");
  const isCancel = className.includes("cancel");
  const isDanger = className.includes("danger");
  const isSmall = className.includes("small");
  const isMini = className.includes("mini");
  const isFull = className.includes("flex");
  return (
    <button
      className={clsx(
        `text-sm text-accent-on bg-accent break-keep shadow-sm rounded-lg px-3.5 h-11 md:hover:bg-accent-hover active:bg-accent-pressed disabled:bg-fg-disabled disabled:hover:bg-fg-disabled disabled:hover:cursor-not-allowed transition-colors duration-200`,
        isFull && "w-full text-center justify-center",
        isGhost &&
          " !text-gray-700 dark:!text-gray-100  !border !border-solid !border-gray-300 dark:!border-gray-500 !bg-transparent",
        isCancel &&
          "!bg-transparent !text-black dark:!text-gray-50 !border !border-solid !border-gray-200",
        isSmall && "!h-auto !py-2",
        noBorder && "!shadow-none !border-none",
        isMini && "!h-auto !px-2.5 !py-1 !text-xs",
        isDanger && "!bg-red-500 disabled:!bg-gray-300 md:hover:!bg-red-500/80 active:bg-red-700",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
export default StyledButton;
