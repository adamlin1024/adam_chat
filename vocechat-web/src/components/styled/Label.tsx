import { LabelHTMLAttributes, ReactNode } from "react";

type Props = LabelHTMLAttributes<HTMLLabelElement> & { children?: ReactNode };
const StyledLabel = ({ children, className = "", ...rest }: Props) => {
  return (
    <label
      className={`text-fg-primary text-sm font-semibold ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
};
export default StyledLabel;
