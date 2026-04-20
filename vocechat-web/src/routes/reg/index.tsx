import { useEffect, useState } from "react";
import { Outlet, useOutletContext, useSearchParams } from "react-router-dom";

import { useCheckMagicTokenValidMutation } from "@/app/services/auth";
import ExpiredTip from "./ExpiredTip";
import SelectLanguage from "../../components/Language";

type ContextType = { token: string };
export default function RegContainer() {
  const [checkToken, { data: tokenIsValid, isLoading: checkingToken }] =
    useCheckMagicTokenValidMutation();
  const [token, setToken] = useState("");
  let [searchParams] = useSearchParams(new URLSearchParams(location.search));
  const magic_token = searchParams.get("magic_token") ?? "";
  useEffect(() => {
    if (magic_token) {
      checkToken(magic_token);
    }
  }, [magic_token]);
  useEffect(() => {
    if (tokenIsValid) {
      setToken(magic_token);
    }
  }, [tokenIsValid, magic_token]);
  if (checkingToken) return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app">
      <p className="font-mono text-[12px] text-fg-muted">VALIDATING INVITE...</p>
    </div>
  );
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-bg-app overflow-x-hidden overflow-y-auto">
        <div className="w-full max-w-[360px] mx-4 rounded-xl border border-border bg-bg-elevated px-[26px] py-7 shadow-overlay max-h-[95vh] overflow-y-auto overflow-x-hidden">
          {magic_token ? (
            tokenIsValid ? (
              <Outlet context={{ token }} />
            ) : (
              <ExpiredTip />
            )
          ) : (
            <Outlet context={{ token }} />
          )}
        </div>
      </div>
      <SelectLanguage />
    </>
  );
}

export function useMagicToken() {
  return useOutletContext<ContextType>();
}
