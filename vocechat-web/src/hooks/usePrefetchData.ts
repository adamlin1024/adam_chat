// import React from 'react'

import { useLazyGetInitializedQuery } from "@/app/services/auth";
import { useLazyGetLoginConfigQuery } from "@/app/services/server";
import { initDriveAutoRenew } from "@/utils/google-drive";
import { useEffect } from "react";

// type Props = {}

const usePrefetchData = () => {
  const [loadLoginConfig] = useLazyGetLoginConfigQuery();
  const [loadOnboardingSetting] = useLazyGetInitializedQuery();
  useEffect(() => {
    loadLoginConfig();
    loadOnboardingSetting();
    // 若已有有效 Drive token，安排自動續約
    initDriveAutoRenew();
  }, []);

  return null;
};

export default usePrefetchData;
