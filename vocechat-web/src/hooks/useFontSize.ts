import { useEffect } from "react";
import { useUserPref } from "./useUserPref";

export type FontSize = "small" | "medium" | "large";

const SCALE_MAP: Record<FontSize, number> = {
  small: 1,
  medium: 1.125,
  large: 1.25,
};

export function useFontSize() {
  const [size, setSize] = useUserPref<FontSize>("font_size", "medium");

  useEffect(() => {
    document.documentElement.style.setProperty("--msg-scale", String(SCALE_MAP[size]));
  }, [size]);

  return { size, setSize };
}
