import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import { useLoginMutation } from "@/app/services/auth";
import { setAuthData } from "@/app/slices/auth.data";
import clsx from "clsx";

export default function OAuthPage() {
  const { t: ct } = useTranslation();
  const [login, { data, isSuccess, isError, isLoading }] = useLoginMutation();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    const startOauth = () => {
      if (!token) {
        setError("Token Not Found");
        return;
      }
      login({ key: token, type: "thirdparty" });
    };
    startOauth();
  }, [token]);
  useEffect(() => {
    if (isError) {
      setError("Try Logging in Error");
    }
  }, [isError]);

  useEffect(() => {
    if (isSuccess && data) {
      // 更新本地认证信息
      toast.success(ct("tip.login"));
      dispatch(setAuthData(data));
      // 硬導頁取代 router navigate：跟 RequireNoAuth 一樣的理由，
      // 強制整個 App 重新 mount，讓 useCache rehydrate + SSE 從乾淨狀態啟動，
      // 避免登入後訊息列空白要使用者自己 F5。
      const navPath = searchParams.get("path") || "/";
      window.location.replace(navPath);
    }
  }, [isSuccess, data]);

  return (
    <div className="flex-center h-screen bg-bg-app">
      <span className={clsx("text-fg-primary text-lg", error && "!text-danger")}>
        {isLoading ? "loading" : ""}
        {error}
      </span>
    </div>
  );
}
