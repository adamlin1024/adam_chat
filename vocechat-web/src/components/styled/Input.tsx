import { DetailedHTMLProps, FC, InputHTMLAttributes, ReactElement, useState } from "react";
import clsx from "clsx";

import IconEyeClose from "@/assets/icons/eye.close.svg";
import IconEyeOpen from "@/assets/icons/eye.open.svg";

interface Props
  extends DetailedHTMLProps<
    Pick<
      InputHTMLAttributes<HTMLInputElement>,
      | "placeholder"
      | "className"
      | "type"
      | "autoFocus"
      | "id"
      | "value"
      | "name"
      | "required"
      | "readOnly"
      | "onChange"
      | "onBlur"
      | "pattern"
      | "disabled"
      | "minLength"
      | "spellCheck"
    >,
    HTMLInputElement
  > {
  prefix?: string | ReactElement;
  ref?: any;
}

const Input: FC<Props> = ({ type = "text", prefix = "", className = "", ...rest }) => {
  const [inputType, setInputType] = useState(type);
  const togglePasswordVisible = () => {
    setInputType((prev) => (prev == "password" ? "text" : "password"));
  };

  const isLarge = className.includes("large");
  const isNone = className.includes("none");
  const isPwd = type == "password";
  const inputClass = clsx(
    `w-full text-sm text-fg-primary p-2 outline-none bg-inherit
    disabled:opacity-50 disabled:pointer-events-none
    placeholder:text-fg-subtle`,
    isLarge && "py-3",
    isNone && "!border-none bg-transparent shadow-none",
    isPwd && "pr-[30px]"
  );
  const wrapperClass = `w-full relative flex overflow-hidden rounded-md border border-solid border-border-subtle bg-bg-surface focus-within:border-border-strong transition-colors ${className}`;
  return type == "password" ? (
    <div className={wrapperClass}>
      <input
        type={inputType}
        autoComplete={inputType == "password" ? "current-password" : "on"}
        className={`${inputClass} ${className}`}
        {...rest}
      />
      <div
        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
        onClick={togglePasswordVisible}
      >
        {inputType == "password" ? (
          <IconEyeClose className="fill-fg-subtle" />
        ) : (
          <IconEyeOpen className="fill-fg-subtle" />
        )}
      </div>
    </div>
  ) : prefix ? (
    <div className={wrapperClass}>
      {typeof prefix === "string" ? (
        <span className="px-4 py-2 text-sm text-fg-secondary bg-bg-elevated border-r border-border-subtle">
          {prefix}
        </span>
      ) : (
        <span className="flex-center p-2 bg-transparent">{prefix}</span>
      )}
      <input className={`${inputClass} ${className}`} type={type} {...rest} />
    </div>
  ) : (
    <input
      type={inputType}
      className={`${inputClass} rounded-md border border-solid border-border-subtle bg-bg-surface focus:border-border-strong transition-colors ${className}`}
      {...rest}
    />
  );
};

export default Input;
