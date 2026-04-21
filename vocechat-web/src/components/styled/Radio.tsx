import { cn } from "@/utils";
import { FC, useId, useState } from "react";

type Props = {
  disabled?: boolean;
  options: string[];
  values: (string | number)[];
  defaultValue?: string | number;
  onChange?: (param: any) => void;
  value: number | string;
};

const VALUE_NOT_SET = "";
const VALUES_NOT_SET: string[] = [];

const Radio: FC<Props> = ({
  disabled = false,
  options,
  values = VALUES_NOT_SET,
  value = VALUE_NOT_SET,
  defaultValue = "",
  onChange = undefined
}) => {
  const id = useId();
  const [fallbackValue, setFallbackValue] = useState(defaultValue);
  const _value = value !== VALUE_NOT_SET ? value : fallbackValue;
  return (
    <form className="w-full flex flex-col gap-2">
      {options.map((item, index) => (
        <div className={cn("relative bg-transparent", disabled && "grayscale-[0.8]")} key={index}>
          <input
            disabled={disabled}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer peer z-50"
            type="radio"
            checked={(values !== VALUES_NOT_SET ? values.indexOf(_value) : _value) === index}
            onChange={() => {
              const valueToSet = values === VALUES_NOT_SET ? index : values[index];
              // Set fallback value if not in controlled mode
              if (value === VALUE_NOT_SET) {
                setFallbackValue(valueToSet);
              }
              // Invoke `onChange` handler if defined
              if (onChange) {
                onChange(valueToSet);
              }
            }}
            id={`${id}-${index}`}
          />
          <div className="text-left px-2 py-3 border border-border rounded-lg w-full h-full bg-bg-surface text-sm text-white transition-colors duration-200">
            <label className="ml-6 cursor-pointer" htmlFor={`${id}-${index}`}>
              {item}
            </label>
          </div>
          <div className="absolute top-1/2 left-3 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-zinc-500 peer-checked:hidden"></div>
          <div className="absolute top-1/2 left-3 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-teal-300 invisible peer-checked:visible flex-center">
            <div className="w-1.5 h-1.5 bg-teal-300 rounded-full"></div>
          </div>
        </div>
      ))}
    </form>
  );
};
export default Radio;
