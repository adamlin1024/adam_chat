import LinkifyText from "@/components/LinkifyText";
import React from "react";
import { useTranslation } from "react-i18next";

const Row = ({
  paramKey,
  paramDefault,
  remarks
}: {
  paramKey: string;
  paramDefault: string | number;
  remarks: string;
}) => {
  return (
    <tr className="bg-bg-elevated text-fg-primary border-b transition duration-300 ease-in-out md:hover:bg-bg-app">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{paramKey}</td>
      <td className="text-sm font-light px-6 py-4 whitespace-nowrap">
        {paramKey == "theme-color" ? (
          <span style={{ color: paramDefault as string }}> {paramDefault}</span>
        ) : (
          paramDefault
        )}
      </td>
      <td className="text-sm font-light px-6 py-4">
        <LinkifyText linkPreview={false} text={remarks} mention={false} />
      </td>
    </tr>
  );
};
type Props = {};

const ConfigDetails = ({}: Props) => {
  const { t } = useTranslation("setting", { keyPrefix: "widget" });
  const { t: wt } = useTranslation("widget");
  return (
    <table className="min-w-full table-auto">
      <thead className="border-b bg-bg-hover">
        <tr>
          {[t("param_key"), t("default_value"), t("remark")].map((title) => (
            <th
              key={title}
              scope="col"
              className="text-sm font-bold text-fg-primary px-6 py-4 text-left whitespace-nowrap"
            >
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          {
            paramKey: "id",
            paramDefault: "-",
            remarks: t("param_id")
          },
          {
            paramKey: "host-id",
            paramDefault: 1,
            remarks: t("param_host")
          },
          {
            paramKey: "auto-reg",
            paramDefault: "true",
            remarks: t("param_auto_reg")
          },
          {
            paramKey: "login-token",
            paramDefault: `-`,
            remarks: t("param_login_token")
          },
          {
            paramKey: "title",
            paramDefault: `[VoceChat Name]`,
            remarks: t("param_title")
          },
          {
            paramKey: "logo",
            paramDefault: `[VoceChat Logo]`,
            remarks: t("param_logo")
          },
          {
            paramKey: "theme-color",
            paramDefault: "#1fe1f9",
            remarks: t("param_theme_color")
          },
          {
            paramKey: "close-width",
            paramDefault: `48(px)`,
            remarks: t("param_close_width")
          },
          {
            paramKey: "close-height",
            paramDefault: `48(px)`,
            remarks: t("param_close_height")
          },
          {
            paramKey: "open-width",
            paramDefault: `380(px)`,
            remarks: t("param_open_width")
          },
          {
            paramKey: "open-height",
            paramDefault: `680(px)`,
            remarks: t("param_open_height")
          },
          {
            paramKey: "position",
            paramDefault: `right`,
            remarks: t("param_position")
          },
          {
            paramKey: "welcome",
            paramDefault: wt("welcome"),
            remarks: t("param_welcome")
          },
          {
            paramKey: "popup-title",
            paramDefault: "Need help?",
            remarks: t("param_popup_title")
          },
          {
            paramKey: "popup-subtitle",
            paramDefault: "Our staff are always ready to help!",
            remarks: t("param_popup_subtitle")
          },
          {
            paramKey: "popup-image",
            paramDefault: "-",
            remarks: t("param_popup_image")
          },
          {
            paramKey: "popup-closable",
            paramDefault: "true",
            remarks: t("param_popup_closable")
          }
        ].map((row) => (
          <Row key={row.paramKey} {...row} />
        ))}
      </tbody>
      <tfoot className="border-t border-solid border-border-subtle bg-bg-hover">
        <tr>
          <td colSpan={3} className="text-fg-primary px-5 py-3 text-sm">
            * All the parameters are optional, and prefixed by{" "}
            <i className="bg-bg-surface text-fg-primary px-1">data-</i>
          </td>
        </tr>
      </tfoot>
    </table>
  );
};

export default ConfigDetails;
