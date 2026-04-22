import { FC, ReactNode, Suspense } from "react";

import PageLoader from "@/components/PageLoader";

type Props = {
  key?: string;
  children?: ReactNode;
};

const Lazy: FC<Props> = ({ key, children }) => {
  return (
    <Suspense
      key={key ?? new Date().getTime()}
      fallback={<PageLoader />}
    >
      {children}
    </Suspense>
  );
};

export default Lazy;
