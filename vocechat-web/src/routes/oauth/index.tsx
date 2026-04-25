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
      // 硬導頁取代 router navigate：強制整個 app 重 mount，讓 usePreload /
      // useStreaming SSE 連線從乾淨狀態啟動，避免 module-level state 殘留導致
      // 登入後訊息列空白。
      toast.success(ct("tip.login"));
      dispatch(setAuthData(data));
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
