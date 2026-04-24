import { useCallback } from "react";
import { useUserPref } from "./useUserPref";

export function useRecentPicks<T>(
  key: string,
  maxSize: number,
  itemKey: (item: T) => string
): [T[], (item: T) => void] {
  const [list, setList] = useUserPref<T[]>(key, []);
  const push = useCallback(
    (item: T) => {
      const id = itemKey(item);
      const next = [item, ...list.filter((x) => itemKey(x) !== id)].slice(0, maxSize);
      setList(next);
    },
    [list, setList, maxSize, itemKey]
  );
  return [list, push];
}
