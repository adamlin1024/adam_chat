import { FC, ReactNode, Suspense } from "react";

import SkeletonScreen from "@/components/SkeletonScreen";

type Props = {
  key?: string;
  children?: ReactNode;
};

const Lazy: FC<Props> = ({ key, children }) => {
  return (
    <Suspense
      key={key ?? new Date().getTime()}
      fallback={<SkeletonScreen />}
    >
      {children}
    </Suspense>
  );
};

export default Lazy;
