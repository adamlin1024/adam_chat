import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";

import BASE_URL from "@/app/config";
import { useLoginMutation, usePasskeyLoginStartMutation, usePasskeyLoginFinishMutation } from "@/app/services/auth";
import { useGetLoginConfigQuery, useGetSMTPStatusQuery } from "@/app/services/server";
import { useAppSelector } from "@/app/store";
import Divider from "@/components/Divider";
import Button from "@/components/styled/Button";
import Input from "@/components/styled/Input";
import StyledLabel from "@/components/styled/Label";
import IconBack from "@/assets/icons/arrow.left.svg";
import MagicLinkLogin from "./MagicLinkLogin";
import SignUpLink from "./SignUpLink";
import SocialLoginButtons from "./SocialLoginButtons";
import { shallowEqual } from "react-redux";
import SelectLanguage from "../../components/Language";
import Downloads from "../../components/Downloads";
import { startPasskeyLogin, isWebAuthnSupported } from "@/passkey";
import ServerVersionChecker from "@/components/ServerVersionChecker";

const defaultInput = {
  email: "",
  password: "",
};
export default function LoginPage() {
  const { name: serverName, logo } = useAppSelector((store) => store.server, shallowEqual);
  const { t } = useTranslation("auth");
  const { t: ct } = useTranslation();
  const { data: enableSMTP, isLoading: loadingSMTPStatus } = useGetSMTPStatusQuery();
  const [login, { isSuccess, isLoading, error }] = useLoginMutation();
  const { data: loginConfig, isSuccess: loginConfigSuccess } = useGetLoginConfigQuery();
  const [emailInputted, setEmailInputted] = useState(false);
  const [input, setInput] = useState(defaultInput);
  const [passkeyLoginStart] = usePasskeyLoginStartMutation();
  const [passkeyLoginFinish] = usePasskeyLoginFinishMutation();
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const state = query.get("state");
    const magic_token = query.get("magic_token");
    const exists = query.get("exists");
    // oidc
    const fromOIDC = code && state;
    if (fromOIDC) {
      login({
        code,
        state,
        type: "oidc",
      });
    }
    // magic link
    if (magic_token && typeof exists !== "undefined") {
      const isLogin = exists == "true";
      if (isLogin) {
        // login
        login({
          magic_token,
          type: "magiclink",
        });
      } else {
        // reg with magic link and set name only
        // navigate(`/register/set_name/login?magic_token=${magic_token}`);
        location.href = `/#/register/set_name/login?magic_token=${magic_token}`;
      }
    }
  }, []);

  useEffect(() => {
    if (error) {
      switch ((error as FetchBaseQueryError).status) {
        case 401:
        case 404:
          toast.error("Username or Password incorrect");
          break;
        case 403:
          toast.error("Login method does not supported");
          break;
        case 410:
          toast.error(
            "No associated account found, please contact user admin for an invitation link to join."
          );
          break;
        // 451 有解析错误，暂时先客户端处理
        case "PARSING_ERROR":
          break;
        default:
          toast.error("Something Error");
          break;
      }
      return;
    }
  }, [error]);
  useEffect(() => {
    console.log("login success", isSuccess);
    if (isSuccess) {
      toast.success(ct("tip.login"));
      // setInput(defaultInput);
      // navigateTo("/");
    }
  }, [isSuccess]);

  const handleLogin = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const enableMagicLink = enableSMTP && loginConfig?.magic_link;
    if (enableMagicLink && !emailInputted) {
      setEmailInputted(true);
      return;
    }
    login({
      ...input,
      type: "password",
    });
  };

  const handleInput = (evt: ChangeEvent<HTMLInputElement>) => {
    const { type } = evt.target.dataset as { type?: "email" | "password" };
    const { value } = evt.target;
    if (!type) return;
    const newInput = { ...input, [type]: value };
    setInput(newInput);
  };
  const handleBack = () => {
    setEmailInputted(false);
  };

  const handlePasskeyLogin = async () => {
    if (!isWebAuthnSupported()) {
      toast.error(t("login.passkey_error_not_supported"));
      return;
    }

    setIsPasskeyLoading(true);
    try {
      const { challenge_id, options } = await passkeyLoginStart({}).unwrap();
      
      const credential = await startPasskeyLogin(options);
      
      await passkeyLoginFinish({ challenge_id, authentication: credential }).unwrap();
      
      toast.success(ct("tip.login"));
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error(t("login.passkey_error_cancelled"));
      } else if (error.status === 404) {
        toast.error(t("login.passkey_error_no_passkey"));
      } else {
        toast.error(t("login.passkey_error_failed"));
      }
      console.error("Passkey login error:", error);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const { email, password } = input;
  if (!loginConfigSuccess) return null;

  const { magic_link, who_can_sign_up: whoCanSignUp, passkey } = loginConfig;

  const enableMagicLink = enableSMTP && magic_link;
  const hideSocials = (enableMagicLink && emailInputted) || whoCanSignUp == "InvitationOnly";
  const showSignIn = !enableMagicLink || emailInputted;
  if (loadingSMTPStatus) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app overflow-y-auto py-6">
      <div className="relative flex w-[360px] flex-col items-center gap-3.5 rounded-xl border border-border bg-bg-elevated px-[26px] py-7 shadow-overlay">
        {emailInputted && (
          <IconBack
            role="button"
            className="absolute left-4 top-5 w-5 h-5 stroke-fg-muted cursor-pointer hover:stroke-fg-secondary transition-colors"
            onClick={handleBack}
          />
        )}
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent overflow-hidden">
          <img
            src={logo || `${BASE_URL}/resource/organization/logo?t=${Date.now()}`}
            alt="logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-[20px] font-bold tracking-tight text-fg-primary text-center">
          {t("login.title", { name: serverName })}
        </h2>
        <p className="font-mono text-[12px] text-fg-muted">輸入帳號密碼繼續</p>
        <form
          className="flex flex-col gap-2.5 w-full"
          autoComplete="false"
          onSubmit={handleLogin}
        >
          {!emailInputted && (
            <input
              autoFocus
              name="email"
              value={email}
              type="email"
              required
              placeholder={t("placeholder_email")}
              data-type="email"
              onChange={handleInput}
              className="w-full rounded-md border border-border bg-bg-app px-3 py-2.5
                         text-[14.5px] text-fg-body placeholder:text-fg-subtle
                         focus:border-border-strong outline-none transition-colors"
            />
          )}
          {(!enableMagicLink || emailInputted) && (
            <input
              type="password"
              value={password}
              name="password"
              required
              data-type="password"
              onChange={handleInput}
              placeholder={t("placeholder_pwd")}
              className="w-full rounded-md border border-border bg-bg-app px-3 py-2.5
                         text-[14.5px] text-fg-body placeholder:text-fg-subtle
                         focus:border-border-strong outline-none transition-colors"
            />
          )}
          {showSignIn ? (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-accent py-2.5 font-mono text-[13px] font-bold tracking-wider text-accent-on
                         disabled:bg-bg-surface disabled:text-fg-disabled transition-colors"
            >
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          ) : (
            <button
              type="submit"
              className="w-full rounded-md bg-accent py-2.5 font-mono text-[13px] font-bold tracking-wider text-accent-on transition-colors"
            >
              CONTINUE
            </button>
          )}
        </form>
        <div className="w-full border-t border-border-subtle pt-3 flex flex-col gap-2.5 w-full">
          {passkey && (
            <ServerVersionChecker empty version="0.5.5">
              <button
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading || isLoading}
                className="w-full rounded-md border border-border py-2.5 font-mono text-[11px] font-bold tracking-wider text-fg-secondary
                           hover:border-border-strong hover:text-fg-primary transition-colors
                           disabled:opacity-50"
              >
                {isPasskeyLoading ? t("login.passkey_authenticating") : t("login.passkey")}
              </button>
            </ServerVersionChecker>
          )}
          {emailInputted && <MagicLinkLogin email={input.email} />}
          {!hideSocials && <SocialLoginButtons />}
        </div>
        {whoCanSignUp === "EveryOne" && <SignUpLink />}
        <Downloads />
      </div>
      <SelectLanguage />
    </div>
  );
}
