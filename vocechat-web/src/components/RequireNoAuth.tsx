import { FC, ReactElement, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { useGetInitializedQuery } from "@/app/services/auth";
import { useAppSelector } from "@/app/store";
import { shallowEqual } from "react-redux";

interface Props {
  children: ReactElement;
  redirectTo?: string;
}

const RequireNoAuth: FC<Props> = ({ children, redirectTo = "/" }) => {
  const { isLoading } = useGetInitializedQuery();
  const { token, initialized, guest } = useAppSelector((store) => store.authData, shallowEqual);
  const shouldRedirect = !!token && !guest;

  // 登入成功後改用硬導頁強制整頁 reload。原因：
  // 雖然 usePreload 已加 [loginUid] deps 在 uid 變動時重跑，但實測
  // useStreaming 的 module-level SSE 連線、ready flag 等全域狀態無法靠
  // React state 重置。最穩的做法是讓整個 app 從頭 mount，所有 hook /
  // module / SSE 都從乾淨狀態啟動 → 訊息會經 SSE backlog 重新進來。
  // 代價：登入後會閃一下白頁（< 1 秒）。
  useEffect(() => {
    if (shouldRedirect) {
      window.location.replace(redirectTo);
    }
  }, [shouldRedirect, redirectTo]);

  if (isLoading) return null;
  if (!initialized) return <Navigate to={`/onboarding`} replace />;
  // 已登入但還沒 reload 完成這段空檔不要 render LoginPage，避免視覺閃跳
  if (shouldRedirect) return null;
  return children;
};

export default RequireNoAuth;
