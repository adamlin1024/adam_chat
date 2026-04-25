import { useGetWidgetExtCSSQuery, useUpdateWidgetExtCSSMutation } from "@/app/services/server";
import StyledButton from "@/components/styled/Button";
import StyledTextarea from "@/components/styled/Textarea";
import React, { ChangeEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

type Props = {};

const ExtCSS = ({}: Props) => {
  const { t } = useTranslation();
  const [updateWidgetCss, { isLoading, isSuccess }] = useUpdateWidgetExtCSSMutation();
  const { data = "", isLoading: loadingCss } = useGetWidgetExtCSSQuery();
  const [code, setCode] = useState(data);
  const handleUpdate = () => {
    updateWidgetCss(code);
  };
  const handleChange = (evt: ChangeEvent<HTMLTextAreaElement>) => {
    setCode(evt.target.value);
  };
  useEffect(() => {
    if (isSuccess) {
      toast.success(t("tip.updated", { ns: "common" }));
    }
  }, [isSuccess]);

  return (
    <div className="flex flex-col gap-1">
      <StyledTextarea
        disabled={loadingCss}
        onChange={handleChange}
        rows={12}
        value={code}
      ></StyledTextarea>
      <StyledButton disabled={isLoading} onClick={handleUpdate} className="small">
        Update CSS Code
      </StyledButton>
    </div>
  );
};

export default ExtCSS;
