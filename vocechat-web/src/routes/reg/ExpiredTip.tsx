import { useTranslation } from "react-i18next";

export default function ExpiredTip() {
  const { t } = useTranslation("auth", { keyPrefix: "magic_link_expire" });
  return (
    <div className="flex flex-col items-center">
      <div className="font-bold text-3xl text-fg-primary mt-3">{t("title")}</div>
      <p className="text-center text-fg-secondary mb-6">{t("desc")}</p>
      <p className="text-center text-fg-secondary">{t("desc_close")}</p>
    </div>
  );
}
