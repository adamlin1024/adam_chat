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

  // 登入 / 註冊成功後改用硬導頁（location.replace）取代 React Router 的 Navigate。
  // 為什麼：登出時會 clearCache() 把 IndexedDB 清光以解決跨裝置 soft-delete 不同步，
  // 但 useCache 的 rehydrate 只在 App mount 跑一次；router 軟導頁不會重 mount，
  // 結果就是登入後訊息列空白、要使用者按 F5 才回來。改成硬導頁等於替使用者按 F5。
  useEffect(() => {
    if (shouldRedirect) {
      window.location.replace(redirectTo);
    }
  }, [shouldRedirect, redirectTo]);

  if (isLoading) return null;
  if (!initialized) return <Navigate to={`/onboarding`} replace />;
  // 已登入但還沒 reload 完成這段空檔別 render 子頁，避免閃登入畫面
  if (shouldRedirect) return null;
  return children;
};

export default RequireNoAuth;
