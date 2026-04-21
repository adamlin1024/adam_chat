import { useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/app/store";
import { compareVersion } from "@/utils";

export default function useIsAnnouncementSupported() {
  const currentVersion = useAppSelector((store) => store.server.version, shallowEqual);
  return useMemo(
    () => Boolean(currentVersion && compareVersion(currentVersion, "0.5.13") >= 0),
    [currentVersion]
  );
}
