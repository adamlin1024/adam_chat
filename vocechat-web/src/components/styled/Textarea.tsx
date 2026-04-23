import { forwardRef, TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;
const StyledTextarea = forwardRef(({ className, ...rest }: Props, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full resize-none rounded-md text-sm p-2.5 bg-bg-surface text-fg-primary
  border border-solid border-border-subtle outline-none
  focus:border-border-strong transition-colors
  disabled:opacity-50 disabled:pointer-events-none
  placeholder:text-fg-subtle
  ${className}`}
      {...rest}
    ></textarea>
  );
});
export default StyledTextarea;
